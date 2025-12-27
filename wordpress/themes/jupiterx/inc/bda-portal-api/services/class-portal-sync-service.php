<?php
/**
 * BDA Portal Sync Service
 * Central service for managing synchronization between Portal and Store
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_Portal_Sync_Service {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Hook into WordPress user events
        add_action('user_register', [$this, 'on_user_register'], 10, 1);
        add_action('profile_update', [$this, 'on_profile_update'], 10, 2);
        add_action('wp_login', [$this, 'on_user_login'], 10, 2);

        // Hook into BDA-specific events
        add_action('bda_portal_user_created', [$this, 'on_portal_user_created'], 10, 2);
        add_action('bda_user_role_changed', [$this, 'on_user_role_changed'], 10, 3);
    }

    /**
     * Notify portal when a new WordPress user is created
     */
    public function on_user_register($user_id) {
        $user = get_user_by('ID', $user_id);
        if (!$user) {
            return;
        }

        $this->notify_portal('user_created', [
            'wp_user_id' => $user_id,
            'email' => $user->user_email,
            'username' => $user->user_login,
            'user_registered' => $user->user_registered,
        ]);
    }

    /**
     * Notify portal when a user profile is updated
     */
    public function on_profile_update($user_id, $old_user_data) {
        $user = get_user_by('ID', $user_id);
        if (!$user) {
            return;
        }

        // Vérifier si c'est un utilisateur avec accès portal
        if (!get_user_meta($user_id, 'bda_portal_active', true)) {
            return;
        }

        $updated_data = [
            'wp_user_id' => $user_id,
            'email' => $user->user_email,
            'first_name' => get_user_meta($user_id, 'first_name', true),
            'last_name' => get_user_meta($user_id, 'last_name', true),
            'bda_role' => get_user_meta($user_id, 'bda_role', true),
            'bda_organization' => get_user_meta($user_id, 'bda_organization', true),
        ];

        $this->notify_portal('profile_updated', $updated_data);
    }

    /**
     * Track user login and sync with portal if needed
     */
    public function on_user_login($user_login, $user) {
        // Mettre à jour le timestamp de dernière connexion
        update_user_meta($user->ID, 'last_login', current_time('mysql'));

        // Notifier le portal si l'utilisateur a accès
        if (get_user_meta($user->ID, 'bda_portal_active', true)) {
            $this->notify_portal('user_login', [
                'wp_user_id' => $user->ID,
                'email' => $user->user_email,
                'login_time' => current_time('mysql'),
            ]);
        }
    }

    /**
     * Handle portal user creation notification
     */
    public function on_portal_user_created($user_id, $portal_data) {
        // Logger l'événement
        error_log("BDA Portal: Portal user created for WP user {$user_id}");

        // Marquer l'utilisateur comme synchronisé
        update_user_meta($user_id, 'bda_portal_sync_status', 'synced');
        update_user_meta($user_id, 'bda_portal_sync_time', current_time('mysql'));
    }

    /**
     * Handle user role changes
     */
    public function on_user_role_changed($user_id, $old_role, $new_role) {
        $this->notify_portal('role_changed', [
            'wp_user_id' => $user_id,
            'old_role' => $old_role,
            'new_role' => $new_role,
            'changed_at' => current_time('mysql'),
        ]);
    }

    /**
     * Send notification to portal
     */
    private function notify_portal($event_type, $data) {
        $portal_webhook_url = get_option('bda_portal_webhook_url', '');

        if (empty($portal_webhook_url)) {
            return false;
        }

        $payload = [
            'event_type' => $event_type,
            'data' => $data,
            'timestamp' => current_time('mysql'),
            'source' => 'wordpress_store',
            'site_url' => get_site_url(),
        ];

        $response = wp_remote_post($portal_webhook_url, [
            'body' => json_encode($payload),
            'headers' => [
                'Content-Type' => 'application/json',
                'X-BDA-Webhook-Key' => get_option('bda_portal_webhook_key', ''),
                'User-Agent' => 'BDA-Store-Sync/1.0',
            ],
            'timeout' => 30,
            'blocking' => false, // Non-blocking pour éviter les ralentissements
        ]);

        // Logger les erreurs
        if (is_wp_error($response)) {
            error_log('BDA Portal Sync Error: ' . $response->get_error_message());
            return false;
        }

        return true;
    }

    /**
     * Create store user from portal data
     */
    public function create_store_user_from_portal($portal_user_data) {
        // Vérifier si l'utilisateur existe déjà
        if (email_exists($portal_user_data['email'])) {
            return new WP_Error('user_exists', 'User already exists in store');
        }

        // Générer un mot de passe temporaire
        $temp_password = wp_generate_password(12, false);

        // Créer l'utilisateur
        $user_id = wp_create_user(
            $portal_user_data['email'],
            $temp_password,
            $portal_user_data['email']
        );

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        // Mettre à jour les métadonnées
        if (isset($portal_user_data['first_name'])) {
            update_user_meta($user_id, 'first_name', sanitize_text_field($portal_user_data['first_name']));
        }

        if (isset($portal_user_data['last_name'])) {
            update_user_meta($user_id, 'last_name', sanitize_text_field($portal_user_data['last_name']));
        }

        if (isset($portal_user_data['bda_role'])) {
            update_user_meta($user_id, 'bda_role', sanitize_text_field($portal_user_data['bda_role']));
        }

        if (isset($portal_user_data['organization'])) {
            update_user_meta($user_id, 'bda_organization', sanitize_text_field($portal_user_data['organization']));
        }

        // Marquer comme créé depuis le portal
        update_user_meta($user_id, 'bda_portal_active', true);
        update_user_meta($user_id, 'bda_created_from_portal', true);
        update_user_meta($user_id, 'bda_portal_sync_status', 'synced');

        // Assigner le rôle customer
        $user = new WP_User($user_id);
        $user->set_role('customer');

        return $user_id;
    }

    /**
     * Sync user data between portal and store
     */
    public function sync_user_data($user_id, $source = 'portal') {
        $user = get_user_by('ID', $user_id);
        if (!$user) {
            return false;
        }

        $sync_data = [
            'wp_user_id' => $user_id,
            'email' => $user->user_email,
            'first_name' => get_user_meta($user_id, 'first_name', true),
            'last_name' => get_user_meta($user_id, 'last_name', true),
            'bda_role' => get_user_meta($user_id, 'bda_role', true),
            'bda_organization' => get_user_meta($user_id, 'bda_organization', true),
            'last_sync' => current_time('mysql'),
            'sync_source' => $source,
        ];

        // Mettre à jour le statut de sync
        update_user_meta($user_id, 'bda_portal_sync_status', 'synced');
        update_user_meta($user_id, 'bda_portal_sync_time', current_time('mysql'));

        return $sync_data;
    }

    /**
     * Get sync status for a user
     */
    public function get_user_sync_status($user_id) {
        return [
            'status' => get_user_meta($user_id, 'bda_portal_sync_status', true) ?: 'not_synced',
            'last_sync' => get_user_meta($user_id, 'bda_portal_sync_time', true),
            'portal_active' => get_user_meta($user_id, 'bda_portal_active', true),
            'created_from_portal' => get_user_meta($user_id, 'bda_created_from_portal', true),
        ];
    }
}