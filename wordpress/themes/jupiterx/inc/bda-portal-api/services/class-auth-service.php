<?php
/**
 * BDA Authentication Service
 * Handles authentication logic between Portal and Store
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_Auth_Service {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Hook into WordPress authentication
        add_filter('authenticate', [$this, 'authenticate_portal_user'], 30, 3);
        add_action('wp_login', [$this, 'after_login'], 10, 2);
        add_action('wp_logout', [$this, 'after_logout'], 10, 1);
    }

    /**
     * Authenticate user and prepare for portal sync if needed
     */
    public function authenticate_portal_user($user, $username, $password) {
        // Si l'authentification a déjà échoué, ne pas continuer
        if (is_wp_error($user)) {
            return $user;
        }

        // Si l'utilisateur est authentifié mais n'a pas d'accès portal
        if ($user instanceof WP_User) {
            $has_portal_access = get_user_meta($user->ID, 'bda_portal_active', true);

            // Si l'utilisateur n'a pas encore d'accès portal, on peut l'activer automatiquement
            if (!$has_portal_access) {
                $this->enable_portal_access($user->ID);
            }
        }

        return $user;
    }

    /**
     * Handle post-login actions
     */
    public function after_login($user_login, $user) {
        // Mettre à jour le timestamp de dernière connexion
        update_user_meta($user->ID, 'last_login', current_time('mysql'));

        // Préparer les données pour le portal
        $portal_data = $this->prepare_portal_data($user->ID);

        // Stocker temporairement les données pour une éventuelle synchronisation
        set_transient('bda_portal_login_' . $user->ID, $portal_data, 300); // 5 minutes
    }

    /**
     * Handle logout actions
     */
    public function after_logout($user_id) {
        // Nettoyer les données temporaires
        delete_transient('bda_portal_login_' . $user_id);

        // Notifier le portal du logout si nécessaire
        $sync_service = BDA_Portal_Sync_Service::get_instance();
        // $sync_service->notify_portal('user_logout', ['wp_user_id' => $user_id]);
    }

    /**
     * Enable portal access for a WordPress user
     */
    public function enable_portal_access($user_id) {
        update_user_meta($user_id, 'bda_portal_active', true);

        // Définir un rôle BDA par défaut si non défini
        $current_role = get_user_meta($user_id, 'bda_role', true);
        if (empty($current_role)) {
            update_user_meta($user_id, 'bda_role', 'individual');
        }

        // Marquer comme prêt pour la synchronisation
        update_user_meta($user_id, 'bda_portal_sync_status', 'pending');

        do_action('bda_portal_access_enabled', $user_id);

        return true;
    }

    /**
     * Verify credentials for portal login
     */
    public function verify_portal_credentials($email, $password) {
        // Nettoyer l'email
        $email = sanitize_email($email);

        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Invalid email format');
        }

        // Authentifier avec WordPress
        $user = wp_authenticate($email, $password);

        if (is_wp_error($user)) {
            return $user;
        }

        // Vérifier/activer l'accès portal
        $this->enable_portal_access($user->ID);

        // Préparer les données pour le portal
        $portal_data = $this->prepare_portal_data($user->ID);

        return [
            'success' => true,
            'user' => $user,
            'portal_data' => $portal_data,
        ];
    }

    /**
     * Prepare user data for portal consumption
     */
    public function prepare_portal_data($user_id) {
        $user = get_user_by('ID', $user_id);
        if (!$user) {
            return false;
        }

        $portal_data = [
            'wp_user_id' => $user->ID,
            'email' => $user->user_email,
            'username' => $user->user_login,
            'first_name' => get_user_meta($user_id, 'first_name', true),
            'last_name' => get_user_meta($user_id, 'last_name', true),
            'display_name' => $user->display_name,

            // BDA specific data
            'bda_role' => get_user_meta($user_id, 'bda_role', true) ?: 'individual',
            'bda_organization' => get_user_meta($user_id, 'bda_organization', true),
            'bda_portal_active' => get_user_meta($user_id, 'bda_portal_active', true),
            'bda_portal_preferences' => get_user_meta($user_id, 'bda_portal_preferences', true),

            // Contact info
            'phone' => get_user_meta($user_id, 'phone', true),
            'company' => get_user_meta($user_id, 'company', true),

            // WordPress data
            'wp_roles' => $user->roles,
            'user_registered' => $user->user_registered,
            'last_login' => get_user_meta($user_id, 'last_login', true),

            // Sync info
            'sync_status' => get_user_meta($user_id, 'bda_portal_sync_status', true),
            'last_sync' => get_user_meta($user_id, 'bda_portal_sync_time', true),
        ];

        // Ajouter les données WooCommerce si disponibles
        if (class_exists('WooCommerce')) {
            $customer = new WC_Customer($user_id);
            $portal_data['woocommerce'] = [
                'is_customer' => in_array('customer', $user->roles),
                'orders_count' => wc_get_customer_order_count($user_id),
                'total_spent' => wc_get_customer_total_spent($user_id),
                'billing_country' => $customer->get_billing_country(),
                'shipping_country' => $customer->get_shipping_country(),
            ];
        }

        return $portal_data;
    }

    /**
     * Create WordPress user from portal data
     */
    public function create_wp_user_from_portal($portal_user_data) {
        $required_fields = ['email', 'password'];

        foreach ($required_fields as $field) {
            if (empty($portal_user_data[$field])) {
                return new WP_Error('missing_field', "Missing required field: {$field}");
            }
        }

        $email = sanitize_email($portal_user_data['email']);
        $password = $portal_user_data['password'];

        // Vérifier si l'utilisateur existe déjà
        if (email_exists($email)) {
            return new WP_Error('user_exists', 'User with this email already exists');
        }

        // Créer l'utilisateur WordPress
        $user_id = wp_create_user($email, $password, $email);

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        // Mettre à jour les métadonnées
        $meta_fields = [
            'first_name',
            'last_name',
            'bda_role',
            'bda_organization',
            'phone',
            'company',
        ];

        foreach ($meta_fields as $field) {
            if (!empty($portal_user_data[$field])) {
                update_user_meta($user_id, $field, sanitize_text_field($portal_user_data[$field]));
            }
        }

        // Activer l'accès portal
        update_user_meta($user_id, 'bda_portal_active', true);
        update_user_meta($user_id, 'bda_created_from_portal', true);

        // Assigner le rôle customer par défaut
        $user = new WP_User($user_id);
        $user->set_role('customer');

        // Marquer comme synchronisé
        update_user_meta($user_id, 'bda_portal_sync_status', 'synced');
        update_user_meta($user_id, 'bda_portal_sync_time', current_time('mysql'));

        do_action('bda_wp_user_created_from_portal', $user_id, $portal_user_data);

        return $user_id;
    }

    /**
     * Generate secure API key for portal communication
     */
    public function generate_api_key($length = 32) {
        return bin2hex(random_bytes($length));
    }

    /**
     * Validate API key
     */
    public function validate_api_key($provided_key, $key_type = 'api') {
        $valid_key = get_option("bda_portal_{$key_type}_key", '');

        if (empty($valid_key) || empty($provided_key)) {
            return false;
        }

        return hash_equals($valid_key, $provided_key);
    }

    /**
     * Get user login redirect URL based on role
     */
    public function get_portal_redirect_url($user_id) {
        $bda_role = get_user_meta($user_id, 'bda_role', true);
        $portal_base_url = get_option('bda_portal_base_url', '');

        if (empty($portal_base_url)) {
            return home_url('/dashboard');
        }

        $redirect_urls = [
            'super_admin' => '/admin/dashboard',
            'admin' => '/admin/dashboard',
            'moderator' => '/moderator/dashboard',
            'member' => '/member/dashboard',
            'individual' => '/dashboard',
        ];

        $path = $redirect_urls[$bda_role] ?? '/dashboard';

        return rtrim($portal_base_url, '/') . $path;
    }
}