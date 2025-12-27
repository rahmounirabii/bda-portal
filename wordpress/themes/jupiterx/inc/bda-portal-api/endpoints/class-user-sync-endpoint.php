<?php
/**
 * BDA Portal User Sync Endpoint
 * Handles user creation and synchronization between Portal and Store
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_User_Sync_Endpoint {

    public function register_routes() {
        register_rest_route('bda-portal/v1', '/users/create-store-user', [
            'methods' => 'POST',
            'callback' => [$this, 'create_store_user'],
            'permission_callback' => [$this, 'check_portal_permission'],
            'args' => [
                'email' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_email($param);
                    }
                ],
                'password' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return !empty($param);
                    }
                ],
                'user_data' => [
                    'required' => false,
                    'default' => []
                ],
            ],
        ]);

        register_rest_route('bda-portal/v1', '/users/sync-profile', [
            'methods' => 'POST',
            'callback' => [$this, 'sync_profile'],
            'permission_callback' => [$this, 'check_portal_permission'],
            'args' => [
                'wp_user_id' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ],
                'profile_data' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_array($param);
                    }
                ],
            ],
        ]);

        register_rest_route('bda-portal/v1', '/users/get-user-data', [
            'methods' => 'GET',
            'callback' => [$this, 'get_user_data'],
            'permission_callback' => [$this, 'check_portal_permission'],
            'args' => [
                'wp_user_id' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ],
            ],
        ]);
    }

    public function create_store_user($request) {
        $email = sanitize_email($request->get_param('email'));
        $password = $request->get_param('password');
        $user_data = $request->get_param('user_data');

        // Vérifier si l'utilisateur existe déjà
        if (email_exists($email)) {
            return new WP_Error('user_exists', 'User already exists', ['status' => 409]);
        }

        // Créer l'utilisateur WordPress
        $user_id = wp_create_user($email, $password, $email);

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        // Mettre à jour les métadonnées utilisateur
        if (!empty($user_data['first_name'])) {
            update_user_meta($user_id, 'first_name', sanitize_text_field($user_data['first_name']));
        }

        if (!empty($user_data['last_name'])) {
            update_user_meta($user_id, 'last_name', sanitize_text_field($user_data['last_name']));
        }

        if (!empty($user_data['bda_role'])) {
            update_user_meta($user_id, 'bda_role', sanitize_text_field($user_data['bda_role']));
        }

        if (!empty($user_data['organization'])) {
            update_user_meta($user_id, 'bda_organization', sanitize_text_field($user_data['organization']));
        }

        // Marquer comme ayant accès au portail
        update_user_meta($user_id, 'bda_portal_active', true);

        // Assigner le rôle WooCommerce customer
        $user = new WP_User($user_id);
        $user->set_role('customer');

        // Logger l'événement
        do_action('bda_store_user_created', $user_id, $user_data);

        return rest_ensure_response([
            'success' => true,
            'wp_user_id' => $user_id,
            'email' => $email,
            'message' => 'Store user created successfully',
        ]);
    }

    public function sync_profile($request) {
        $wp_user_id = intval($request->get_param('wp_user_id'));
        $profile_data = $request->get_param('profile_data');

        // Vérifier que l'utilisateur existe
        $user = get_user_by('ID', $wp_user_id);
        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
        }

        // Mettre à jour les champs autorisés
        $allowed_fields = [
            'first_name',
            'last_name',
            'bda_role',
            'bda_organization',
            'phone',
            'company',
            'bda_portal_preferences',
        ];

        $updated_fields = [];

        foreach ($allowed_fields as $field) {
            if (isset($profile_data[$field])) {
                $value = sanitize_text_field($profile_data[$field]);

                if (in_array($field, ['first_name', 'last_name'])) {
                    // Mettre à jour les champs standards WP
                    update_user_meta($wp_user_id, $field, $value);
                } else {
                    // Mettre à jour les meta fields personnalisés
                    update_user_meta($wp_user_id, $field, $value);
                }

                $updated_fields[] = $field;
            }
        }

        // Logger l'événement
        do_action('bda_profile_synced', $wp_user_id, $updated_fields, $profile_data);

        return rest_ensure_response([
            'success' => true,
            'updated_fields' => $updated_fields,
            'message' => 'Profile synchronized successfully',
        ]);
    }

    public function get_user_data($request) {
        $wp_user_id = intval($request->get_param('wp_user_id'));

        // Vérifier que l'utilisateur existe
        $user = get_user_by('ID', $wp_user_id);
        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
        }

        // Récupérer toutes les données utilisateur
        $user_data = [
            'wp_user_id' => $user->ID,
            'email' => $user->user_email,
            'username' => $user->user_login,
            'first_name' => get_user_meta($user->ID, 'first_name', true),
            'last_name' => get_user_meta($user->ID, 'last_name', true),
            'bda_role' => get_user_meta($user->ID, 'bda_role', true),
            'bda_organization' => get_user_meta($user->ID, 'bda_organization', true),
            'phone' => get_user_meta($user->ID, 'phone', true),
            'company' => get_user_meta($user->ID, 'company', true),
            'bda_portal_active' => get_user_meta($user->ID, 'bda_portal_active', true),
            'bda_portal_preferences' => get_user_meta($user->ID, 'bda_portal_preferences', true),
            'wp_roles' => $user->roles,
            'last_login' => get_user_meta($user->ID, 'last_login', true),
            'user_registered' => $user->user_registered,
        ];

        // Ajouter les données WooCommerce si disponibles
        if (class_exists('WooCommerce')) {
            $customer = new WC_Customer($user->ID);
            $user_data['woocommerce'] = [
                'billing' => $customer->get_billing(),
                'shipping' => $customer->get_shipping(),
                'orders_count' => wc_get_customer_order_count($user->ID),
                'total_spent' => wc_get_customer_total_spent($user->ID),
            ];
        }

        return rest_ensure_response([
            'success' => true,
            'user_data' => $user_data,
        ]);
    }

    public function check_portal_permission($request) {
        $api_key = $request->get_header('X-BDA-API-Key');

        if (empty($api_key)) {
            return false;
        }

        $valid_key = get_option('bda_portal_api_key', '');
        return !empty($valid_key) && hash_equals($valid_key, $api_key);
    }
}