<?php
/**
 * BDA Portal API Initialization
 * WordPress REST API endpoints for BDA Portal integration
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// CORS headers are handled by /inc/api/config/cors.php (loaded via api-init.php)
// DO NOT add CORS headers here to prevent duplicate header issues

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

        register_rest_route('bda-portal/v1', '/woocommerce/user-books', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_user_books'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('bda-portal/v1', '/woocommerce/book-download', array(
            'methods' => 'POST',
            'callback' => array($this, 'get_book_download_url'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('bda-portal/v1', '/woocommerce/products', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_woocommerce_products'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('bda-portal/v1', '/woocommerce/orders', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_woocommerce_orders'),
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

    /**
     * Get user's purchased books
     */
    public function get_user_books($request) {
        $customer_email = sanitize_email($request->get_param('customer_email'));
        $search = sanitize_text_field($request->get_param('search'));

        if (empty($customer_email)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Customer email is required'
            ), 400);
        }

        // Check if WooCommerce is active
        if (!class_exists('WooCommerce')) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'WooCommerce is not active'
            ), 500);
        }

        // Get completed orders for this customer
        $orders = wc_get_orders(array(
            'customer' => $customer_email,
            'status' => 'completed',
            'limit' => -1,
            'orderby' => 'date',
            'order' => 'DESC'
        ));

        $books = array();

        foreach ($orders as $order) {
            foreach ($order->get_items() as $item_id => $item) {
                $product = $item->get_product();

                if (!$product) {
                    continue;
                }

                // Check if this is a book product (virtual/downloadable)
                if (!$product->is_downloadable()) {
                    continue;
                }

                // Get product metadata
                $product_id = $product->get_id();
                $format = get_post_meta($product_id, '_book_format', true);
                $pages = get_post_meta($product_id, '_book_pages', true);
                $cover_image = wp_get_attachment_url($product->get_image_id());

                // Check if search filter applies
                if (!empty($search)) {
                    $product_name = $product->get_name();
                    if (stripos($product_name, $search) === false) {
                        continue;
                    }
                }

                // Get download expiry (12 months from purchase by default)
                $purchased_at = $order->get_date_created();
                $expires_at = null;
                if ($purchased_at) {
                    $expiry_date = clone $purchased_at;
                    $expiry_date->modify('+12 months');
                    $expires_at = $expiry_date->format('Y-m-d H:i:s');
                }

                $books[] = array(
                    'id' => $order->get_id() . '_' . $product_id,
                    'product_id' => $product_id,
                    'product_name' => $product->get_name(),
                    'sku' => $product->get_sku(),
                    'cover_image' => $cover_image ?: null,
                    'purchased_at' => $purchased_at ? $purchased_at->format('Y-m-d H:i:s') : null,
                    'expires_at' => $expires_at,
                    'order_id' => $order->get_id(),
                    'order_status' => $order->get_status(),
                    'format' => $format ?: 'pdf',
                    'pages' => $pages ? intval($pages) : null,
                    'description' => $product->get_short_description()
                );
            }
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $books
        ), 200);
    }

    /**
     * Get book download URL
     */
    public function get_book_download_url($request) {
        $product_id = intval($request->get_param('product_id'));
        $order_id = intval($request->get_param('order_id'));

        if (empty($product_id) || empty($order_id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Product ID and Order ID are required'
            ), 400);
        }

        // Check if WooCommerce is active
        if (!class_exists('WooCommerce')) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'WooCommerce is not active'
            ), 500);
        }

        // Get the order
        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Order not found'
            ), 404);
        }

        // Verify order contains this product
        $found = false;
        foreach ($order->get_items() as $item) {
            if ($item->get_product_id() == $product_id) {
                $found = true;
                break;
            }
        }

        if (!$found) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Product not found in order'
            ), 404);
        }

        // Get product downloads
        $product = wc_get_product($product_id);
        if (!$product || !$product->is_downloadable()) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Product is not downloadable'
            ), 400);
        }

        $downloads = $product->get_downloads();
        if (empty($downloads)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'No downloads available for this product'
            ), 404);
        }

        // Get first download URL (most books have single file)
        $download = reset($downloads);
        $download_url = $download->get_file();

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'download_url' => $download_url
            )
        ), 200);
    }

    /**
     * Get WooCommerce products
     */
    public function get_woocommerce_products($request) {
        // Check if WooCommerce is active
        if (!class_exists('WooCommerce')) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'WooCommerce is not active'
            ), 500);
        }

        // Get query parameters
        $page = intval($request->get_param('page')) ?: 1;
        $per_page = intval($request->get_param('per_page')) ?: 20;
        $search = sanitize_text_field($request->get_param('search'));
        $category = sanitize_text_field($request->get_param('category'));
        $status = sanitize_text_field($request->get_param('status')) ?: 'publish';

        // Build WooCommerce product query args
        $args = array(
            'status' => $status,
            'limit' => $per_page,
            'page' => $page,
            'orderby' => 'date',
            'order' => 'DESC',
            'return' => 'objects'
        );

        if (!empty($search)) {
            $args['search'] = $search;
        }

        if (!empty($category)) {
            $args['category'] = array($category);
        }

        // Get products
        $products = wc_get_products($args);
        $total_products = wc_get_products(array_merge($args, array('limit' => -1, 'return' => 'ids')));
        $total_count = is_array($total_products) ? count($total_products) : 0;

        // Format products
        $formatted_products = array();
        foreach ($products as $product) {
            // Get image URL and fix port if needed
            $image_url = wp_get_attachment_url($product->get_image_id());
            if ($image_url) {
                $image_url = str_replace('://localhost:8080/', '://localhost:8090/', $image_url);
            }

            $formatted_products[] = array(
                'id' => $product->get_id(),
                'name' => $product->get_name(),
                'slug' => $product->get_slug(),
                'permalink' => $product->get_permalink(),
                'type' => $product->get_type(),
                'status' => $product->get_status(),
                'description' => $product->get_description(),
                'short_description' => $product->get_short_description(),
                'sku' => $product->get_sku(),
                'price' => $product->get_price(),
                'regular_price' => $product->get_regular_price(),
                'sale_price' => $product->get_sale_price(),
                'image' => $image_url,
                'on_sale' => $product->is_on_sale(),
                'purchasable' => $product->is_purchasable(),
                'total_sales' => $product->get_total_sales(),
                'virtual' => $product->is_virtual(),
                'downloadable' => $product->is_downloadable(),
                'manage_stock' => $product->managing_stock(),
                'stock_quantity' => $product->get_stock_quantity(),
                'stock_status' => $product->get_stock_status(),
                'backorders' => $product->get_backorders(),
                'featured' => $product->is_featured(),
                'date_created' => $product->get_date_created() ? $product->get_date_created()->date('Y-m-d H:i:s') : null,
                'date_modified' => $product->get_date_modified() ? $product->get_date_modified()->date('Y-m-d H:i:s') : null,
                'images' => array_map(function($image_id) {
                    return array(
                        'id' => $image_id,
                        'src' => wp_get_attachment_url($image_id),
                        'thumbnail' => wp_get_attachment_image_url($image_id, 'thumbnail'),
                        'medium' => wp_get_attachment_image_url($image_id, 'medium'),
                        'large' => wp_get_attachment_image_url($image_id, 'large')
                    );
                }, $product->get_gallery_image_ids()),
                'categories' => array_map(function($term) {
                    return array(
                        'id' => $term->term_id,
                        'name' => $term->name,
                        'slug' => $term->slug
                    );
                }, wp_get_post_terms($product->get_id(), 'product_cat')),
                'tags' => array_map(function($term) {
                    return array(
                        'id' => $term->term_id,
                        'name' => $term->name,
                        'slug' => $term->slug
                    );
                }, wp_get_post_terms($product->get_id(), 'product_tag'))
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $formatted_products,
            'pagination' => array(
                'total' => $total_count,
                'per_page' => $per_page,
                'current_page' => $page,
                'total_pages' => ceil($total_count / $per_page)
            )
        ), 200);
    }

    /**
     * Get WooCommerce orders
     */
    public function get_woocommerce_orders($request) {
        // Check if WooCommerce is active
        if (!class_exists('WooCommerce')) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'WooCommerce is not active'
            ), 500);
        }

        // Get query parameters
        $page = intval($request->get_param('page')) ?: 1;
        $per_page = intval($request->get_param('per_page')) ?: 20;
        $customer_email = sanitize_email($request->get_param('customer_email'));
        $status = sanitize_text_field($request->get_param('status'));

        // Build WooCommerce order query args
        $args = array(
            'limit' => $per_page,
            'page' => $page,
            'orderby' => 'date',
            'order' => 'DESC',
            'return' => 'objects'
        );

        if (!empty($customer_email)) {
            $args['customer'] = $customer_email;
        }

        if (!empty($status)) {
            $args['status'] = $status;
        }

        // Get orders
        $orders = wc_get_orders($args);
        $total_orders = wc_get_orders(array_merge($args, array('limit' => -1, 'return' => 'ids')));
        $total_count = is_array($total_orders) ? count($total_orders) : 0;

        // Format orders
        $formatted_orders = array();
        foreach ($orders as $order) {
            $formatted_orders[] = array(
                'id' => $order->get_id(),
                'order_number' => $order->get_order_number(),
                'status' => $order->get_status(),
                'currency' => $order->get_currency(),
                'total' => $order->get_total(),
                'subtotal' => $order->get_subtotal(),
                'tax_total' => $order->get_total_tax(),
                'shipping_total' => $order->get_shipping_total(),
                'discount_total' => $order->get_discount_total(),
                'customer_email' => $order->get_billing_email(),
                'customer_first_name' => $order->get_billing_first_name(),
                'customer_last_name' => $order->get_billing_last_name(),
                'payment_method' => $order->get_payment_method(),
                'payment_method_title' => $order->get_payment_method_title(),
                'date_created' => $order->get_date_created() ? $order->get_date_created()->date('Y-m-d H:i:s') : null,
                'date_modified' => $order->get_date_modified() ? $order->get_date_modified()->date('Y-m-d H:i:s') : null,
                'date_completed' => $order->get_date_completed() ? $order->get_date_completed()->date('Y-m-d H:i:s') : null,
                'items' => array_map(function($item) {
                    $product = $item->get_product();
                    return array(
                        'id' => $item->get_id(),
                        'product_id' => $item->get_product_id(),
                        'variation_id' => $item->get_variation_id(),
                        'name' => $item->get_name(),
                        'quantity' => $item->get_quantity(),
                        'subtotal' => $item->get_subtotal(),
                        'total' => $item->get_total(),
                        'sku' => $product ? $product->get_sku() : null
                    );
                }, $order->get_items())
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $formatted_orders,
            'pagination' => array(
                'total' => $total_count,
                'per_page' => $per_page,
                'current_page' => $page,
                'total_pages' => ceil($total_count / $per_page)
            )
        ), 200);
    }
}

// Initialize the API
new BDA_Portal_API();