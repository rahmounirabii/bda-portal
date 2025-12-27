<?php
/**
 * Voucher Automation Controller
 * Auto-generate exam vouchers when WooCommerce orders are completed
 *
 * BUSINESS LOGIC:
 * - One purchase = One voucher (or multiple based on configuration)
 * - Expired vouchers don't block new purchases
 * - Used vouchers don't block new purchases
 * - Only prevents duplicate processing of SAME ORDER (idempotency)
 *
 * @author BDA Portal Team
 */

class VoucherAutomationController {

    private $supabase_url;
    private $supabase_key;

    public function __construct() {
        // Get Supabase credentials from multiple sources (in order of priority):
        // 1. WordPress constants (defined in wp-config.php)
        // 2. Environment variables
        // 3. WordPress options (can be set via admin panel)

        $this->supabase_url = $this->get_config('SUPABASE_URL');
        $this->supabase_key = $this->get_config('SUPABASE_SERVICE_KEY') ?: $this->get_config('SUPABASE_ANON_KEY');

        if (empty($this->supabase_url) || empty($this->supabase_key)) {
            error_log('❌ [BDA Voucher] Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in wp-config.php');
            return;
        }

        // Hook into WooCommerce order status changes
        add_action('woocommerce_order_status_completed', [$this, 'handle_order_completed'], 10, 1);
        add_action('woocommerce_order_status_refunded', [$this, 'handle_order_refunded'], 10, 1);

        error_log('✅ [BDA Voucher] Automation controller initialized');
    }

    /**
     * Get configuration value from multiple sources
     * Priority: 1. WordPress constant, 2. Environment variable, 3. WordPress option
     *
     * @param string $key Configuration key
     * @return string|null Configuration value
     */
    private function get_config($key) {
        // 1. Check WordPress constant (defined in wp-config.php)
        if (defined($key)) {
            return constant($key);
        }

        // 2. Check environment variable
        $env_value = getenv($key);
        if (!empty($env_value)) {
            return $env_value;
        }

        // 3. Check WordPress option (stored in database)
        $option_key = 'bda_' . strtolower($key);
        $option_value = get_option($option_key);
        if (!empty($option_value)) {
            return $option_value;
        }

        return null;
    }

    /**
     * Handle order completed event
     *
     * @param int $order_id WooCommerce order ID
     */
    public function handle_order_completed($order_id) {
        error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        error_log("🎯 [BDA Voucher] Processing order #{$order_id}");
        error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        try {
            $order = wc_get_order($order_id);
            if (!$order) {
                error_log("❌ [BDA Voucher] Order not found: #{$order_id}");
                return;
            }

            // 1. Get customer information
            $customer_email = $order->get_billing_email();
            $customer_first_name = $order->get_billing_first_name();
            $customer_last_name = $order->get_billing_last_name();

            error_log("👤 [BDA Voucher] Customer: {$customer_first_name} {$customer_last_name} ({$customer_email})");

            // 2. CRITICAL: Check if user exists in Portal (NO AUTO-CREATION)
            $user = $this->lookup_portal_user($customer_email);
            if (!$user) {
                error_log("⚠️ [BDA Voucher] User NOT FOUND in Portal database: {$customer_email}");
                $order->add_order_note(
                    "⚠️ Automatic voucher generation skipped: Customer must create a BDA Portal account first.\n" .
                    "Customer email: {$customer_email}\n" .
                    "Action required: Ask customer to sign up at https://portal.bda.com"
                );
                return;
            }

            error_log("✅ [BDA Voucher] Portal user found: {$user['id']} ({$user['email']})");

            // 3. Get certification products configuration
            $cert_products = $this->get_certification_products();
            if (empty($cert_products)) {
                error_log("ℹ️ [BDA Voucher] No certification products configured in /admin/certification-products");
                return;
            }

            error_log("📋 [BDA Voucher] Found " . count($cert_products) . " certification product(s) configured");

            // 4. Process each order item
            $items = $order->get_items();
            $total_vouchers_created = 0;
            $all_voucher_codes = [];

            foreach ($items as $item) {
                $product_id = $item->get_product_id();
                $product_name = $item->get_name();
                $quantity = $item->get_quantity();

                error_log("📦 [BDA Voucher] Processing item: {$product_name} (ID: {$product_id}, Qty: {$quantity})");

                // Find matching certification product
                $cert_product = $this->find_cert_product($product_id, $cert_products);

                if (!$cert_product) {
                    error_log("  ℹ️ Not a certification product - skipping");
                    continue;
                }

                error_log("  ✅ Certification product matched!");
                error_log("     Type: {$cert_product['certification_type']}");
                error_log("     Vouchers per purchase: {$cert_product['vouchers_per_purchase']}");
                error_log("     Validity: {$cert_product['voucher_validity_months']} months");

                // Calculate expected vouchers
                $expected_count = $quantity * $cert_product['vouchers_per_purchase'];

                error_log("  📊 Expected vouchers: {$quantity} × {$cert_product['vouchers_per_purchase']} = {$expected_count}");

                // IDEMPOTENCY CHECK: Verify if vouchers already exist for THIS ORDER + PRODUCT
                if (!$this->should_create_vouchers($order_id, $cert_product['id'], $expected_count)) {
                    error_log("  ✅ [Idempotency] Vouchers already created for this order - skipping");
                    continue;
                }

                // Generate vouchers
                error_log("  🎫 Creating {$expected_count} voucher(s)...");

                $result = $this->generate_vouchers(
                    $user['id'],
                    $cert_product,
                    $order_id,
                    $expected_count,
                    "Auto-generated from WooCommerce order #{$order->get_order_number()}"
                );

                if ($result['count'] > 0) {
                    error_log("  ✅ Successfully created {$result['count']} voucher(s):");
                    foreach ($result['codes'] as $code) {
                        error_log("     • {$code}");
                    }

                    $total_vouchers_created += $result['count'];
                    $all_voucher_codes = array_merge($all_voucher_codes, $result['codes']);
                } else {
                    error_log("  ⚠️ Failed to create vouchers");
                }
            }

            // 5. Add order note with results
            if ($total_vouchers_created > 0) {
                $note = "✅ {$total_vouchers_created} exam voucher(s) automatically generated\n\n";
                $note .= "Customer: {$customer_email}\n";
                $note .= "Portal User ID: {$user['id']}\n\n";
                $note .= "Generated vouchers:\n";
                foreach ($all_voucher_codes as $code) {
                    $note .= "• {$code}\n";
                }
                $note .= "\nVouchers have been added to the customer's Portal account.";

                $order->add_order_note($note);

                error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                error_log("🎉 [BDA Voucher] SUCCESS: Created {$total_vouchers_created} voucher(s)");
                error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            } else {
                error_log("ℹ️ [BDA Voucher] No vouchers created (no certification products in order)");
            }

        } catch (Exception $e) {
            error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            error_log("❌ [BDA Voucher] EXCEPTION: " . $e->getMessage());
            error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            if (isset($order)) {
                $order->add_order_note("❌ Voucher generation error: " . $e->getMessage());
            }
        }
    }

    /**
     * Find certification product by WooCommerce product ID
     */
    private function find_cert_product($product_id, $cert_products) {
        foreach ($cert_products as $cp) {
            if ($cp['woocommerce_product_id'] == $product_id) {
                return $cp;
            }
        }
        return null;
    }

    /**
     * Check if vouchers should be created (IDEMPOTENCY LOGIC)
     *
     * Business Logic:
     * - Only prevents duplicate processing of SAME ORDER
     * - Does NOT prevent customer from buying multiple times
     * - Does NOT care about expired or used vouchers from OTHER orders
     *
     * @param int $order_id WooCommerce order ID
     * @param string $cert_product_id Certification product UUID
     * @param int $expected_count Expected number of vouchers
     * @return bool True if should create, False if already exists
     */
    private function should_create_vouchers($order_id, $cert_product_id, $expected_count) {
        $existing = $this->get_existing_vouchers($order_id, $cert_product_id);
        $actual_count = count($existing);

        if ($actual_count >= $expected_count) {
            // Already created all vouchers for THIS ORDER
            error_log("  ✅ [Idempotency] Found {$actual_count} existing voucher(s) for this order");
            return false;
        }

        if ($actual_count > 0 && $actual_count < $expected_count) {
            // Partial creation detected (rare edge case)
            error_log("  ⚠️ [Partial] Found {$actual_count}/{$expected_count} vouchers. Will create missing ones.");
        }

        return true;
    }

    /**
     * Lookup user in Portal database by email
     *
     * @param string $email Customer email
     * @return array|null User data or null if not found
     */
    private function lookup_portal_user($email) {
        $url = "{$this->supabase_url}/rest/v1/users?email=eq." . urlencode($email) . "&select=id,email,first_name,last_name";

        $response = wp_remote_get($url, [
            'headers' => [
                'apikey' => $this->supabase_key,
                'Authorization' => "Bearer {$this->supabase_key}",
            ],
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            error_log("❌ [API Error] User lookup failed: " . $response->get_error_message());
            return null;
        }

        $body = wp_remote_retrieve_body($response);
        $users = json_decode($body, true);

        return !empty($users) && is_array($users) ? $users[0] : null;
    }

    /**
     * Get all active certification products from Portal
     *
     * @return array Array of certification products
     */
    private function get_certification_products() {
        $url = "{$this->supabase_url}/rest/v1/certification_products?is_active=eq.true&select=*";

        $response = wp_remote_get($url, [
            'headers' => [
                'apikey' => $this->supabase_key,
                'Authorization' => "Bearer {$this->supabase_key}",
            ],
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            error_log("❌ [API Error] Certification products fetch failed: " . $response->get_error_message());
            return [];
        }

        $body = wp_remote_retrieve_body($response);
        $products = json_decode($body, true);

        return is_array($products) ? $products : [];
    }

    /**
     * Get existing vouchers for a specific order and certification product
     *
     * @param int $order_id WooCommerce order ID
     * @param string $cert_product_id Certification product UUID
     * @return array Array of existing vouchers
     */
    private function get_existing_vouchers($order_id, $cert_product_id) {
        $url = "{$this->supabase_url}/rest/v1/exam_vouchers?" .
               "woocommerce_order_id=eq.{$order_id}&" .
               "certification_product_id=eq.{$cert_product_id}&" .
               "select=id,code,status";

        $response = wp_remote_get($url, [
            'headers' => [
                'apikey' => $this->supabase_key,
                'Authorization' => "Bearer {$this->supabase_key}",
            ],
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            error_log("❌ [API Error] Existing vouchers check failed: " . $response->get_error_message());
            return [];
        }

        $body = wp_remote_retrieve_body($response);
        $vouchers = json_decode($body, true);

        return is_array($vouchers) ? $vouchers : [];
    }

    /**
     * Generate exam vouchers in Portal database
     *
     * @param string $user_id Portal user UUID
     * @param array $cert_product Certification product data
     * @param int $order_id WooCommerce order ID
     * @param int $count Number of vouchers to create
     * @param string $notes Admin notes
     * @return array ['count' => int, 'codes' => array]
     */
    private function generate_vouchers($user_id, $cert_product, $order_id, $count, $notes) {
        $codes = [];
        $created_count = 0;

        // Calculate expiration date
        $expires_at = date('Y-m-d\TH:i:s\Z', strtotime("+{$cert_product['voucher_validity_months']} months"));

        for ($i = 0; $i < $count; $i++) {
            try {
                // Step 1: Generate unique voucher code using database function
                $code = $this->generate_voucher_code($cert_product['certification_type']);

                if (!$code) {
                    error_log("    ❌ Failed to generate code for voucher " . ($i + 1));
                    continue;
                }

                // Step 2: Insert voucher into database
                $voucher_data = [
                    'code' => $code,
                    'user_id' => $user_id,
                    'certification_type' => $cert_product['certification_type'],
                    'quiz_id' => $cert_product['quiz_id'],
                    'expires_at' => $expires_at,
                    'woocommerce_order_id' => $order_id,
                    'certification_product_id' => $cert_product['id'],
                    'admin_notes' => $notes,
                    'status' => 'unused',
                ];

                $success = $this->insert_voucher($voucher_data);

                if ($success) {
                    $codes[] = $code;
                    $created_count++;
                } else {
                    error_log("    ❌ Failed to insert voucher " . ($i + 1));
                }

            } catch (Exception $e) {
                error_log("    ❌ Exception creating voucher " . ($i + 1) . ": " . $e->getMessage());
            }
        }

        return ['count' => $created_count, 'codes' => $codes];
    }

    /**
     * Generate unique voucher code using Supabase RPC function
     *
     * @param string $cert_type Certification type (CP or SCP)
     * @return string|null Generated code or null on failure
     */
    private function generate_voucher_code($cert_type) {
        $url = "{$this->supabase_url}/rest/v1/rpc/generate_voucher_code";

        $response = wp_remote_post($url, [
            'headers' => [
                'apikey' => $this->supabase_key,
                'Authorization' => "Bearer {$this->supabase_key}",
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode(['cert_type' => $cert_type]),
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            error_log("❌ [API Error] Code generation failed: " . $response->get_error_message());
            return null;
        }

        $body = wp_remote_retrieve_body($response);
        $code = json_decode($body, true);

        // Remove quotes from JSON string response
        return is_string($code) ? trim($code, '"') : null;
    }

    /**
     * Insert voucher into database
     *
     * @param array $voucher_data Voucher data
     * @return bool Success status
     */
    private function insert_voucher($voucher_data) {
        $url = "{$this->supabase_url}/rest/v1/exam_vouchers";

        $response = wp_remote_post($url, [
            'headers' => [
                'apikey' => $this->supabase_key,
                'Authorization' => "Bearer {$this->supabase_key}",
                'Content-Type' => 'application/json',
                'Prefer' => 'return=representation',
            ],
            'body' => json_encode($voucher_data),
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            error_log("❌ [API Error] Voucher insert failed: " . $response->get_error_message());
            return false;
        }

        $status = wp_remote_retrieve_response_code($response);
        return $status === 201;
    }

    /**
     * Handle order refunded event
     * Revoke all unused vouchers from the refunded order
     *
     * @param int $order_id WooCommerce order ID
     */
    public function handle_order_refunded($order_id) {
        error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        error_log("💰 [BDA Voucher] Processing refund for order #{$order_id}");
        error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        try {
            $order = wc_get_order($order_id);
            if (!$order) {
                error_log("❌ [BDA Voucher] Order not found: #{$order_id}");
                return;
            }

            // Get all unused vouchers for this order
            $url = "{$this->supabase_url}/rest/v1/exam_vouchers?" .
                   "woocommerce_order_id=eq.{$order_id}&" .
                   "status=eq.unused&" .
                   "select=id,code";

            $response = wp_remote_get($url, [
                'headers' => [
                    'apikey' => $this->supabase_key,
                    'Authorization' => "Bearer {$this->supabase_key}",
                ],
                'timeout' => 15,
            ]);

            if (is_wp_error($response)) {
                error_log("❌ [API Error] Failed to fetch vouchers for refund: " . $response->get_error_message());
                return;
            }

            $body = wp_remote_retrieve_body($response);
            $vouchers = json_decode($body, true);

            if (empty($vouchers) || !is_array($vouchers)) {
                error_log("ℹ️ [BDA Voucher] No unused vouchers to revoke");
                $order->add_order_note("ℹ️ Refund processed: No unused vouchers to revoke");
                return;
            }

            error_log("🎫 [BDA Voucher] Found " . count($vouchers) . " unused voucher(s) to revoke");

            // Revoke each voucher
            $revoked_count = 0;
            $revoked_codes = [];

            foreach ($vouchers as $voucher) {
                $revoke_url = "{$this->supabase_url}/rest/v1/exam_vouchers?id=eq.{$voucher['id']}";

                $revoke_response = wp_remote_request($revoke_url, [
                    'method' => 'PATCH',
                    'headers' => [
                        'apikey' => $this->supabase_key,
                        'Authorization' => "Bearer {$this->supabase_key}",
                        'Content-Type' => 'application/json',
                    ],
                    'body' => json_encode([
                        'status' => 'revoked',
                        'admin_notes' => "Auto-revoked due to order refund #{$order->get_order_number()}"
                    ]),
                    'timeout' => 15,
                ]);

                if (!is_wp_error($revoke_response)) {
                    $revoked_count++;
                    $revoked_codes[] = $voucher['code'];
                    error_log("  ✅ Revoked: {$voucher['code']}");
                }
            }

            if ($revoked_count > 0) {
                $note = "✅ Refund processed: Revoked {$revoked_count} unused voucher(s)\n\n";
                $note .= "Revoked vouchers:\n";
                foreach ($revoked_codes as $code) {
                    $note .= "• {$code}\n";
                }

                $order->add_order_note($note);

                error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                error_log("✅ [BDA Voucher] Revoked {$revoked_count} voucher(s)");
                error_log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            }

        } catch (Exception $e) {
            error_log("❌ [BDA Voucher] Refund exception: " . $e->getMessage());
            if (isset($order)) {
                $order->add_order_note("❌ Error revoking vouchers: " . $e->getMessage());
            }
        }
    }
}

// Initialize the controller
new VoucherAutomationController();
