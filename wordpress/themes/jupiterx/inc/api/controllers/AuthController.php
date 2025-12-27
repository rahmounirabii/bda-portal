<?php
/**
 * BDA Portal API - Authentication Controller
 *
 * Handles authentication-related API endpoints
 *
 * @package BDA_Portal
 * @subpackage API/Controllers
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_Auth_Controller {

    /**
     * Verify user credentials
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function verify(WP_REST_Request $request) {
        $email = sanitize_email($request->get_param('email'));
        $password = $request->get_param('password');

        if (empty($email) || empty($password)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Email and password are required'
            ), 400);
        }

        $user = wp_authenticate($email, $password);

        if (is_wp_error($user)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Invalid credentials'
            ), 401);
        }

        // Get WordPress role
        $wp_role = $user->roles[0] ?? 'subscriber';

        // Map WordPress role to BDA role for Supabase compatibility
        $bda_role = self::map_wp_role_to_bda_role($wp_role);

        return new WP_REST_Response(array(
            'success' => true,
            'user_data' => array(
                'wp_user_id' => $user->ID,
                'email' => $user->user_email,
                'first_name' => get_user_meta($user->ID, 'first_name', true),
                'last_name' => get_user_meta($user->ID, 'last_name', true),
                'wp_role' => $wp_role,
                'bda_role' => $bda_role
            ),
            'needs_portal_account' => true
        ), 200);
    }

    /**
     * Create portal user from WordPress user
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function create_portal_user(WP_REST_Request $request) {
        $wp_user_id = intval($request->get_param('wp_user_id'));
        $portal_data = $request->get_param('portal_data') ?: array();

        // Validate wp_user_id
        if (empty($wp_user_id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'wp_user_id is required'
            ), 400);
        }

        // Get WordPress user
        $wp_user = get_user_by('ID', $wp_user_id);
        if (!$wp_user) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'WordPress user not found'
            ), 404);
        }

        // Mark user as having portal access
        update_user_meta($wp_user_id, 'bda_portal_active', true);
        update_user_meta($wp_user_id, 'bda_portal_created_at', current_time('mysql'));

        // Update BDA role if provided
        if (!empty($portal_data['bda_role'])) {
            update_user_meta($wp_user_id, 'bda_role', sanitize_text_field($portal_data['bda_role']));
        }

        // Update organization if provided
        if (!empty($portal_data['organization'])) {
            update_user_meta($wp_user_id, 'bda_organization', sanitize_text_field($portal_data['organization']));
        }

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Portal user created successfully',
            'wp_user_id' => $wp_user_id,
            'email' => $wp_user->user_email
        ), 201);
    }

    /**
     * Map WordPress roles to BDA roles for Supabase
     *
     * @param string $wp_role WordPress role
     * @return string BDA role
     */
    private static function map_wp_role_to_bda_role($wp_role) {
        $role_mapping = array(
            'administrator' => 'admin',
            'admin' => 'admin',
            'ecp' => 'ecp',
            'pdp' => 'pdp',
            'super_admin' => 'super_admin',
            // Default roles
            'subscriber' => 'individual',
            'customer' => 'individual',
            'shop_manager' => 'admin',
            'editor' => 'admin'
        );

        return $role_mapping[$wp_role] ?? 'individual';
    }
}
