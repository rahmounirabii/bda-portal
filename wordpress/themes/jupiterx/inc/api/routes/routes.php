<?php
/**
 * BDA Portal API - Routes Registration
 *
 * Registers all API endpoints for the BDA Portal
 *
 * @package BDA_Portal
 * @subpackage API/Routes
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register all BDA Portal API routes
 */
function bda_api_register_routes() {
    $namespace = 'bda-portal/v1';

    // ============================================================================
    // Test Endpoint
    // ============================================================================
    register_rest_route($namespace, '/test', array(
        'methods' => 'GET',
        'callback' => 'bda_api_test_endpoint',
        'permission_callback' => '__return_true'
    ));

    // ============================================================================
    // Authentication Routes
    // ============================================================================
    register_rest_route($namespace, '/auth/verify', array(
        'methods' => 'POST',
        'callback' => array('BDA_Auth_Controller', 'verify'),
        'permission_callback' => '__return_true'
    ));

    register_rest_route($namespace, '/auth/create-portal-user', array(
        'methods' => 'POST',
        'callback' => array('BDA_Auth_Controller', 'create_portal_user'),
        'permission_callback' => '__return_true'
    ));

    // ============================================================================
    // Users Routes
    // ============================================================================
    register_rest_route($namespace, '/users/check-user', array(
        'methods' => 'GET',
        'callback' => array('BDA_Users_Controller', 'check_user'),
        'permission_callback' => '__return_true'
    ));

    register_rest_route($namespace, '/users/create', array(
        'methods' => 'POST',
        'callback' => array('BDA_Users_Controller', 'create'),
        'permission_callback' => '__return_true'
    ));

    // ============================================================================
    // WooCommerce Routes
    // ============================================================================

    // Products
    register_rest_route($namespace, '/woocommerce/products', array(
        'methods' => 'GET',
        'callback' => array('BDA_WooCommerce_Controller', 'get_products'),
        'permission_callback' => '__return_true'
    ));

    // Orders
    register_rest_route($namespace, '/woocommerce/orders', array(
        'methods' => 'GET',
        'callback' => array('BDA_WooCommerce_Controller', 'get_orders'),
        'permission_callback' => '__return_true'
    ));

    register_rest_route($namespace, '/woocommerce/orders/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => array('BDA_WooCommerce_Controller', 'get_order'),
        'permission_callback' => '__return_true'
    ));

    register_rest_route($namespace, '/woocommerce/orders/(?P<id>\d+)/mark-vouchers-generated', array(
        'methods' => 'POST',
        'callback' => array('BDA_WooCommerce_Controller', 'mark_vouchers_generated'),
        'permission_callback' => '__return_true'
    ));

    // Books
    register_rest_route($namespace, '/woocommerce/user-books', array(
        'methods' => 'GET',
        'callback' => array('BDA_WooCommerce_Controller', 'get_user_books'),
        'permission_callback' => '__return_true'
    ));

    register_rest_route($namespace, '/woocommerce/book-download', array(
        'methods' => 'POST',
        'callback' => array('BDA_WooCommerce_Controller', 'get_book_download'),
        'permission_callback' => '__return_true'
    ));
}

/**
 * Test endpoint callback
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response
 */
function bda_api_test_endpoint(WP_REST_Request $request) {
    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'BDA Portal API is working',
        'timestamp' => current_time('mysql')
    ), 200);
}

add_action('rest_api_init', 'bda_api_register_routes');
