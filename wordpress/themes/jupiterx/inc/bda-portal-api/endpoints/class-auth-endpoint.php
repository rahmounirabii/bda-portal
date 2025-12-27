<?php
/**
 * BDA Portal Authentication Endpoint
 * Handles Portal-Store authentication sync
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_Auth_Endpoint {

    public function register_routes() {
        register_rest_route('bda-portal/v1', '/auth/verify', [
            'methods' => 'POST',
            'callback' => [$this, 'verify_credentials'],
            'permission_callback' => '__return_true',
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
            ],
        ]);

        register_rest_route('bda-portal/v1', '/auth/create-portal-user', [
            'methods' => 'POST',
            'callback' => [$this, 'create_portal_user'],
            'permission_callback' => [$this, 'check_portal_permission'],
            'args' => [
                'wp_user_id' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ],
                'portal_data' => [
                    'required' => false,
                    'default' => []
                ],
            ],
        ]);
    }

    public function verify_credentials($request) {
        $email = sanitize_email($request->get_param('email'));
        $password = $request->get_param('password');

        // Vérifier les credentials WordPress
        $user = wp_authenticate($email, $password);

        if (is_wp_error($user)) {
            return new WP_Error('auth_failed', 'Invalid credentials', ['status' => 401]);
        }

        // Utilisateur existe dans WP, préparer les données pour le portail
        $user_data = [
            'wp_user_id' => $user->ID,
            'email' => $user->user_email,
            'first_name' => get_user_meta($user->ID, 'first_name', true),
            'last_name' => get_user_meta($user->ID, 'last_name', true),
            'bda_role' => get_user_meta($user->ID, 'bda_role', true) ?: 'individual',
            'organization' => get_user_meta($user->ID, 'bda_organization', true),
            'portal_active' => get_user_meta($user->ID, 'bda_portal_active', true) ?: false,
        ];

        return rest_ensure_response([
            'success' => true,
            'user_data' => $user_data,
            'needs_portal_account' => !$user_data['portal_active'],
        ]);
    }

    public function create_portal_user($request) {
        $wp_user_id = intval($request->get_param('wp_user_id'));
        $portal_data = $request->get_param('portal_data');

        // Vérifier que l'utilisateur WP existe
        $wp_user = get_user_by('ID', $wp_user_id);
        if (!$wp_user) {
            return new WP_Error('user_not_found', 'WordPress user not found', ['status' => 404]);
        }

        // Marquer comme ayant accès au portail
        update_user_meta($wp_user_id, 'bda_portal_active', true);

        // Mettre à jour les métadonnées BDA si fournies
        if (!empty($portal_data['bda_role'])) {
            update_user_meta($wp_user_id, 'bda_role', sanitize_text_field($portal_data['bda_role']));
        }

        if (!empty($portal_data['organization'])) {
            update_user_meta($wp_user_id, 'bda_organization', sanitize_text_field($portal_data['organization']));
        }

        // Logger l'événement
        do_action('bda_portal_user_created', $wp_user_id, $portal_data);

        return rest_ensure_response([
            'success' => true,
            'message' => 'Portal access granted',
            'wp_user_id' => $wp_user_id,
        ]);
    }

    public function check_portal_permission($request) {
        // Pour l'instant, on accepte toutes les requêtes avec une clé API
        $api_key = $request->get_header('X-BDA-API-Key');

        if (empty($api_key)) {
            return false;
        }

        // Vérifier la clé API (à implémenter selon vos besoins)
        $valid_key = get_option('bda_portal_api_key', '');
        return !empty($valid_key) && hash_equals($valid_key, $api_key);
    }
}