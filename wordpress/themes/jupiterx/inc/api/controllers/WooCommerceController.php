<?php
/**
 * BDA Portal API - WooCommerce Controller
 *
 * Handles WooCommerce integration API endpoints
 *
 * @package BDA_Portal
 * @subpackage API/Controllers
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_WooCommerce_Controller {

    /**
     * Check if WooCommerce is active
     *
     * @return WP_REST_Response|null Returns error response if not active, null otherwise
     */
    private static function check_woocommerce() {
        if (!class_exists('WooCommerce')) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'WooCommerce is not installed or activated'
            ), 503);
        }
        return null;
    }

    /**
     * Get all WooCommerce products
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function get_products(WP_REST_Request $request) {
        $error = self::check_woocommerce();
        if ($error) return $error;

        $args = array(
            'status' => 'publish',
            'limit' => -1,
            'orderby' => 'date',
            'order' => 'DESC'
        );

        $products = wc_get_products($args);
        $products_data = array();

        foreach ($products as $product) {
            $products_data[] = array(
                'id' => $product->get_id(),
                'name' => $product->get_name(),
                'sku' => $product->get_sku(),
                'price' => $product->get_price(),
                'regular_price' => $product->get_regular_price(),
                'sale_price' => $product->get_sale_price(),
                'status' => $product->get_status(),
                'type' => $product->get_type(),
                'description' => $product->get_short_description(),
                'image' => wp_get_attachment_url($product->get_image_id()),
                'permalink' => get_permalink($product->get_id()),
                'created_at' => $product->get_date_created()->date('Y-m-d H:i:s')
            );
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $products_data,
            'count' => count($products_data)
        ), 200);
    }

    /**
     * Get WooCommerce orders
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function get_orders(WP_REST_Request $request) {
        $error = self::check_woocommerce();
        if ($error) return $error;

        // Get query parameters
        $status = $request->get_param('status') ?: 'any';
        $product_id = $request->get_param('product_id');
        $customer_email = $request->get_param('customer_email');
        $limit = $request->get_param('limit') ?: 50;
        $page = $request->get_param('page') ?: 1;

        $args = array(
            'status' => $status,
            'limit' => $limit,
            'page' => $page,
            'orderby' => 'date',
            'order' => 'DESC'
        );

        if ($customer_email) {
            $args['customer'] = $customer_email;
        }

        $orders = wc_get_orders($args);
        $orders_data = array();

        foreach ($orders as $order) {
            // Skip refund orders - they don't have get_order_number() method
            if ($order instanceof \Automattic\WooCommerce\Admin\Overrides\OrderRefund ||
                $order instanceof \WC_Order_Refund ||
                $order->get_type() === 'shop_order_refund') {
                continue;
            }

            $order_data = array(
                'id' => $order->get_id(),
                'order_number' => method_exists($order, 'get_order_number') ? $order->get_order_number() : $order->get_id(),
                'status' => $order->get_status(),
                'total' => $order->get_total(),
                'currency' => $order->get_currency(),
                'date_created' => $order->get_date_created()->date('Y-m-d H:i:s'),
                'date_completed' => $order->get_date_completed() ? $order->get_date_completed()->date('Y-m-d H:i:s') : null,
                'customer' => array(
                    'email' => $order->get_billing_email(),
                    'first_name' => $order->get_billing_first_name(),
                    'last_name' => $order->get_billing_last_name()
                ),
                'items' => array(),
                'vouchers_generated' => get_post_meta($order->get_id(), '_bda_vouchers_generated', true) === 'yes'
            );

            // Get order items
            foreach ($order->get_items() as $item) {
                $product = $item->get_product();
                if ($product) {
                    $item_data = array(
                        'product_id' => $product->get_id(),
                        'product_name' => $item->get_name(),
                        'sku' => $product->get_sku(),
                        'quantity' => $item->get_quantity(),
                        'total' => $item->get_total()
                    );

                    // Filter by product_id if specified
                    if (!$product_id || $product->get_id() == $product_id) {
                        $order_data['items'][] = $item_data;
                    }
                }
            }

            // Only include order if it has items (when filtering by product)
            if (!$product_id || count($order_data['items']) > 0) {
                $orders_data[] = $order_data;
            }
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $orders_data,
            'count' => count($orders_data)
        ), 200);
    }

    /**
     * Get specific order details
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function get_order(WP_REST_Request $request) {
        $error = self::check_woocommerce();
        if ($error) return $error;

        $order_id = $request['id'];
        $order = wc_get_order($order_id);

        if (!$order) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Order not found'
            ), 404);
        }

        $order_data = array(
            'id' => $order->get_id(),
            'order_number' => $order->get_order_number(),
            'status' => $order->get_status(),
            'total' => $order->get_total(),
            'currency' => $order->get_currency(),
            'date_created' => $order->get_date_created()->date('Y-m-d H:i:s'),
            'date_completed' => $order->get_date_completed() ? $order->get_date_completed()->date('Y-m-d H:i:s') : null,
            'customer' => array(
                'email' => $order->get_billing_email(),
                'first_name' => $order->get_billing_first_name(),
                'last_name' => $order->get_billing_last_name(),
                'phone' => $order->get_billing_phone()
            ),
            'billing' => array(
                'address_1' => $order->get_billing_address_1(),
                'address_2' => $order->get_billing_address_2(),
                'city' => $order->get_billing_city(),
                'state' => $order->get_billing_state(),
                'postcode' => $order->get_billing_postcode(),
                'country' => $order->get_billing_country()
            ),
            'items' => array(),
            'vouchers_generated' => get_post_meta($order->get_id(), '_bda_vouchers_generated', true) === 'yes',
            'vouchers_generated_at' => get_post_meta($order->get_id(), '_bda_vouchers_generated_at', true)
        );

        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            if ($product) {
                $order_data['items'][] = array(
                    'product_id' => $product->get_id(),
                    'product_name' => $item->get_name(),
                    'sku' => $product->get_sku(),
                    'quantity' => $item->get_quantity(),
                    'subtotal' => $item->get_subtotal(),
                    'total' => $item->get_total()
                );
            }
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => $order_data
        ), 200);
    }

    /**
     * Mark order as vouchers generated
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function mark_vouchers_generated(WP_REST_Request $request) {
        $error = self::check_woocommerce();
        if ($error) return $error;

        $order_id = $request['id'];
        $order = wc_get_order($order_id);

        if (!$order) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Order not found'
            ), 404);
        }

        // Mark order as vouchers generated
        update_post_meta($order_id, '_bda_vouchers_generated', 'yes');
        update_post_meta($order_id, '_bda_vouchers_generated_at', current_time('mysql'));

        // Add order note
        $order->add_order_note('BDA certification vouchers generated for this order.');

        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Order marked as vouchers generated',
            'data' => array(
                'order_id' => $order_id,
                'vouchers_generated' => true,
                'vouchers_generated_at' => current_time('mysql')
            )
        ), 200);
    }

    /**
     * Get user's purchased books
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function get_user_books(WP_REST_Request $request) {
        $error = self::check_woocommerce();
        if ($error) return $error;

        $customer_email = sanitize_email($request->get_param('customer_email'));
        $search = sanitize_text_field($request->get_param('search'));

        if (empty($customer_email)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Customer email is required'
            ), 400);
        }

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

                if (!$product || !$product->is_downloadable()) {
                    continue;
                }

                $product_id = $product->get_id();
                $format = get_post_meta($product_id, '_book_format', true);
                $pages = get_post_meta($product_id, '_book_pages', true);
                $cover_image = wp_get_attachment_url($product->get_image_id());

                if (!empty($search)) {
                    $product_name = $product->get_name();
                    if (stripos($product_name, $search) === false) {
                        continue;
                    }
                }

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
     * Get download URL for a book
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public static function get_book_download(WP_REST_Request $request) {
        $error = self::check_woocommerce();
        if ($error) return $error;

        $product_id = intval($request->get_param('product_id'));
        $order_id = intval($request->get_param('order_id'));

        if (empty($product_id) || empty($order_id)) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Product ID and Order ID are required'
            ), 400);
        }

        $order = wc_get_order($order_id);
        if (!$order) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Order not found'
            ), 404);
        }

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

        // Try method 1: Get download URL from order's downloadable items (most reliable)
        $download_url = null;
        $downloadable_items = $order->get_downloadable_items();
        foreach ($downloadable_items as $item) {
            if ($item['product_id'] == $product_id) {
                $download_url = $item['download_url'];
                break;
            }
        }

        // Try method 2: Query download permissions directly from database
        if (!$download_url) {
            global $wpdb;
            $customer_email = $order->get_billing_email();
            $order_key = $order->get_order_key();

            $permission = $wpdb->get_row($wpdb->prepare(
                "SELECT download_id, product_id FROM {$wpdb->prefix}woocommerce_downloadable_product_permissions
                WHERE order_id = %d AND product_id = %d LIMIT 1",
                $order_id,
                $product_id
            ));

            if ($permission) {
                $download_url = add_query_arg(array(
                    'download_file' => $product_id,
                    'order' => $order_key,
                    'email' => rawurlencode($customer_email),
                    'key' => $permission->download_id
                ), home_url('/'));
            }
        }

        // Try method 3: Generate download URL manually using first download file
        if (!$download_url) {
            $download = reset($downloads);
            $download_id = key($downloads);
            $customer_email = $order->get_billing_email();
            $order_key = $order->get_order_key();

            // Check if permission exists, if not grant it
            $data_store = WC_Data_Store::load('customer-download');
            $existing_permissions = $data_store->get_downloads(array(
                'order_id' => $order_id,
                'product_id' => $product_id,
            ));

            if (empty($existing_permissions)) {
                // Grant download permission
                wc_downloadable_file_permission($download_id, $product_id, $order);
            }

            // Generate download URL
            $download_url = add_query_arg(array(
                'download_file' => $product_id,
                'order' => $order_key,
                'email' => rawurlencode($customer_email),
                'key' => $download_id
            ), home_url('/'));
        }

        if (!$download_url) {
            return new WP_REST_Response(array(
                'success' => false,
                'message' => 'Could not generate download URL'
            ), 500);
        }

        return new WP_REST_Response(array(
            'success' => true,
            'data' => array(
                'download_url' => $download_url
            )
        ), 200);
    }
}
