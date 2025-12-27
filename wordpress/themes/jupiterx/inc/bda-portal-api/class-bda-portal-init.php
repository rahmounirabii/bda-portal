<?php
/**
 * BDA Portal API Initialization
 * WordPress REST API endpoints for BDA Portal integration
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class BDA_Portal_API {

    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_routes() {
        register_rest_route('bda-portal/v1', '/test', array(
            'methods' => 'GET',
            'callback' => array($this, 'test_endpoint'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('bda-portal/v1', '/users/check-user', array(
            'methods' => 'GET',
            'callback' => array($this, 'check_user'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('bda-portal/v1', '/users/create', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_user'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('bda-portal/v1', '/auth/verify', array(
            'methods' => 'POST',
            'callback' => array($this, 'verify_credentials'),
            'permission_callback' => '__return_true'
        ));
    }

    /**
     * Test endpoint
     */
    public function test_endpoint($request) {
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'BDA Portal API is working',
            'timestamp' => current_time('mysql')
        ), 200);
    }

    /**
     * Check if user exists
     */
    public function check_user($request) {
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
                'exists' => true,
                'user' => array(
                    'id' => $user->ID,
                    'email' => $user->user_email,
                    'firstName' => get_user_meta($user->ID, 'first_name', true),
                    'lastName' => get_user_meta($user->ID, 'last_name', true),
                    'wpRole' => $user->roles[0] ?? 'subscriber'
                )
            ), 200);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'exists' => false
        ), 200);
    }

    /**
     * Create new user
     */
    public function create_user($request) {
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

    /**
     * Verify user credentials
     */
    public function verify_credentials($request) {
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

        return new WP_REST_Response(array(
            'success' => true,
            'user' => array(
                'id' => $user->ID,
                'email' => $user->user_email,
                'firstName' => get_user_meta($user->ID, 'first_name', true),
                'lastName' => get_user_meta($user->ID, 'last_name', true),
                'wpRole' => $user->roles[0] ?? 'subscriber'
            )
        ), 200);
    }
}

// Initialize the API
new BDA_Portal_API();
