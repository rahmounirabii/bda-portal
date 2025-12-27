<?php
/**
 * BDA Portal Profile Endpoint
 * Handles profile-specific operations and data retrieval
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_Profile_Endpoint {

    public function register_routes() {
        register_rest_route('bda-portal/v1', '/profile/update-role', [
            'methods' => 'POST',
            'callback' => [$this, 'update_user_role'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'wp_user_id' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ],
                'new_role' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return in_array($param, ['individual', 'member', 'moderator', 'admin', 'super_admin']);
                    }
                ],
            ],
        ]);

        register_rest_route('bda-portal/v1', '/profile/get-organization-members', [
            'methods' => 'GET',
            'callback' => [$this, 'get_organization_members'],
            'permission_callback' => [$this, 'check_portal_permission'],
            'args' => [
                'organization' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return !empty($param);
                    }
                ],
            ],
        ]);

        register_rest_route('bda-portal/v1', '/profile/update-preferences', [
            'methods' => 'POST',
            'callback' => [$this, 'update_preferences'],
            'permission_callback' => [$this, 'check_portal_permission'],
            'args' => [
                'wp_user_id' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ],
                'preferences' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_array($param);
                    }
                ],
            ],
        ]);
    }

    public function update_user_role($request) {
        $wp_user_id = intval($request->get_param('wp_user_id'));
        $new_role = sanitize_text_field($request->get_param('new_role'));

        // Vérifier que l'utilisateur existe
        $user = get_user_by('ID', $wp_user_id);
        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
        }

        // Mettre à jour le rôle BDA
        $old_role = get_user_meta($wp_user_id, 'bda_role', true);
        update_user_meta($wp_user_id, 'bda_role', $new_role);

        // Logger le changement
        do_action('bda_user_role_changed', $wp_user_id, $old_role, $new_role);

        return rest_ensure_response([
            'success' => true,
            'old_role' => $old_role,
            'new_role' => $new_role,
            'message' => 'User role updated successfully',
        ]);
    }

    public function get_organization_members($request) {
        $organization = sanitize_text_field($request->get_param('organization'));

        // Rechercher tous les utilisateurs de cette organisation
        $users = get_users([
            'meta_key' => 'bda_organization',
            'meta_value' => $organization,
            'fields' => ['ID', 'user_email', 'user_registered'],
        ]);

        $members = [];
        foreach ($users as $user) {
            $members[] = [
                'wp_user_id' => $user->ID,
                'email' => $user->user_email,
                'first_name' => get_user_meta($user->ID, 'first_name', true),
                'last_name' => get_user_meta($user->ID, 'last_name', true),
                'bda_role' => get_user_meta($user->ID, 'bda_role', true),
                'bda_portal_active' => get_user_meta($user->ID, 'bda_portal_active', true),
                'user_registered' => $user->user_registered,
            ];
        }

        return rest_ensure_response([
            'success' => true,
            'organization' => $organization,
            'members_count' => count($members),
            'members' => $members,
        ]);
    }

    public function update_preferences($request) {
        $wp_user_id = intval($request->get_param('wp_user_id'));
        $preferences = $request->get_param('preferences');

        // Vérifier que l'utilisateur existe
        $user = get_user_by('ID', $wp_user_id);
        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
        }

        // Sanitizer les préférences
        $allowed_preferences = [
            'language',
            'timezone',
            'notifications_email',
            'notifications_push',
            'theme',
            'dashboard_layout',
        ];

        $sanitized_preferences = [];
        foreach ($preferences as $key => $value) {
            if (in_array($key, $allowed_preferences)) {
                $sanitized_preferences[$key] = sanitize_text_field($value);
            }
        }

        // Mettre à jour les préférences
        update_user_meta($wp_user_id, 'bda_portal_preferences', $sanitized_preferences);

        // Logger l'événement
        do_action('bda_preferences_updated', $wp_user_id, $sanitized_preferences);

        return rest_ensure_response([
            'success' => true,
            'preferences' => $sanitized_preferences,
            'message' => 'Preferences updated successfully',
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

    public function check_admin_permission($request) {
        // Vérifier d'abord la permission de base
        if (!$this->check_portal_permission($request)) {
            return false;
        }

        // Vérifier le niveau admin (à implémenter selon vos besoins)
        $admin_key = $request->get_header('X-BDA-Admin-Key');
        if (empty($admin_key)) {
            return false;
        }

        $valid_admin_key = get_option('bda_portal_admin_key', '');
        return !empty($valid_admin_key) && hash_equals($valid_admin_key, $admin_key);
    }
}