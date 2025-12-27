<?php
/**
 * BDA Portal API - Users Controller
 *
 * Handles user management API endpoints
 *
 * @package BDA_Portal
 * @subpackage API/Controllers
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_Users_Controller {

    /**
     * Check if a user exists by email
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function check_user(WP_REST_Request $request) {
        $email = sanitize_email($request->get_param('email'));

        if (empty($email)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Email is required'
            ), 400);
        }

        $user = get_user_by('email', $email);

        if ($user) {
            return new WP_REST_Response(array(
                'success' => true,
                'user_exists' => true,
                'user_data' => array(
                    'wp_user_id' => $user->ID,
                    'email' => $user->user_email,
                    'first_name' => get_user_meta($user->ID, 'first_name', true),
                    'last_name' => get_user_meta($user->ID, 'last_name', true),
                    'bda_role' => $user->roles[0] ?? 'subscriber'
                )
            ), 200);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'user_exists' => false
        ), 200);
    }

    /**
     * Create a new WordPress user
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function create(WP_REST_Request $request) {
        $email = sanitize_email($request->get_param('email'));
        $password = $request->get_param('password');
        $firstName = sanitize_text_field($request->get_param('firstName'));
        $lastName = sanitize_text_field($request->get_param('lastName'));

        if (empty($email) || empty($password)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Email and password are required'
            ), 400);
        }

        if (email_exists($email)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'User already exists'
            ), 409);
        }

        $user_data = array(
            'user_login' => $email,
            'user_email' => $email,
            'user_pass' => $password,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'role' => 'subscriber'
        );

        $user_id = wp_insert_user($user_data);

        if (is_wp_error($user_id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => $user_id->get_error_message()
            ), 500);
        }

        $user = get_user_by('ID', $user_id);

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'id' => $user->ID,
                'email' => $user->user_email,
                'firstName' => get_user_meta($user->ID, 'first_name', true),
                'lastName' => get_user_meta($user->ID, 'last_name', true),
                'wpRole' => $user->roles[0] ?? 'subscriber'
            )
        ), 201);
    }
}
