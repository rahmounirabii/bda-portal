<?php
/**
 * BDA Portal Webhook Endpoint
 * Handles incoming webhooks from Portal and outgoing notifications
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_Webhook_Endpoint {

    public function register_routes() {
        register_rest_route('bda-portal/v1', '/webhooks/user-updated', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_user_updated'],
            'permission_callback' => [$this, 'check_webhook_permission'],
            'args' => [
                'wp_user_id' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ],
                'updated_data' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_array($param);
                    }
                ],
            ],
        ]);

        register_rest_route('bda-portal/v1', '/webhooks/portal-notification', [
            'methods' => 'POST',
            'callback' => [$this, 'send_portal_notification'],
            'permission_callback' => [$this, 'check_webhook_permission'],
            'args' => [
                'event_type' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return in_array($param, ['user_created', 'profile_updated', 'role_changed', 'login']);
                    }
                ],
                'wp_user_id' => [
                    'required' => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ],
                'event_data' => [
                    'required' => false,
                    'default' => []
                ],
            ],
        ]);

        register_rest_route('bda-portal/v1', '/webhooks/test', [
            'methods' => 'GET',
            'callback' => [$this, 'test_webhook'],
            'permission_callback' => [$this, 'check_webhook_permission'],
        ]);
    }

    public function handle_user_updated($request) {
        $wp_user_id = intval($request->get_param('wp_user_id'));
        $updated_data = $request->get_param('updated_data');

        // Vérifier que l'utilisateur existe
        $user = get_user_by('ID', $wp_user_id);
        if (!$user) {
            return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
        }

        // Logger l'événement reçu
        $this->log_webhook_event('user_updated', [
            'wp_user_id' => $wp_user_id,
            'updated_data' => $updated_data,
            'timestamp' => current_time('mysql'),
        ]);

        // Traiter les mises à jour selon le type
        $processed_updates = [];

        foreach ($updated_data as $field => $value) {
            switch ($field) {
                case 'first_name':
                case 'last_name':
                    update_user_meta($wp_user_id, $field, sanitize_text_field($value));
                    $processed_updates[] = $field;
                    break;

                case 'bda_role':
                case 'bda_organization':
                case 'phone':
                case 'company':
                    update_user_meta($wp_user_id, $field, sanitize_text_field($value));
                    $processed_updates[] = $field;
                    break;

                case 'bda_portal_preferences':
                    if (is_array($value)) {
                        update_user_meta($wp_user_id, $field, $value);
                        $processed_updates[] = $field;
                    }
                    break;
            }
        }

        // Déclencher les actions WordPress appropriées
        do_action('bda_user_updated_from_portal', $wp_user_id, $processed_updates, $updated_data);

        return rest_ensure_response([
            'success' => true,
            'processed_updates' => $processed_updates,
            'message' => 'User data updated successfully',
        ]);
    }

    public function send_portal_notification($request) {
        $event_type = sanitize_text_field($request->get_param('event_type'));
        $wp_user_id = intval($request->get_param('wp_user_id'));
        $event_data = $request->get_param('event_data');

        // Préparer les données de notification
        $notification_data = [
            'event_type' => $event_type,
            'wp_user_id' => $wp_user_id,
            'event_data' => $event_data,
            'timestamp' => current_time('mysql'),
            'site_url' => get_site_url(),
        ];

        // Logger l'événement
        $this->log_webhook_event('portal_notification', $notification_data);

        // Envoyer vers le portail (à implémenter selon vos besoins)
        $portal_url = get_option('bda_portal_webhook_url', '');

        if (!empty($portal_url)) {
            $response = wp_remote_post($portal_url, [
                'body' => json_encode($notification_data),
                'headers' => [
                    'Content-Type' => 'application/json',
                    'X-BDA-Webhook-Key' => get_option('bda_portal_webhook_key', ''),
                ],
                'timeout' => 30,
            ]);

            if (is_wp_error($response)) {
                return new WP_Error('webhook_failed', 'Failed to send notification to portal', ['status' => 500]);
            }
        }

        return rest_ensure_response([
            'success' => true,
            'event_type' => $event_type,
            'message' => 'Notification sent successfully',
        ]);
    }

    public function test_webhook($request) {
        return rest_ensure_response([
            'success' => true,
            'message' => 'Webhook endpoint is working',
            'timestamp' => current_time('mysql'),
            'server_info' => [
                'php_version' => PHP_VERSION,
                'wp_version' => get_bloginfo('version'),
                'site_url' => get_site_url(),
            ],
        ]);
    }

    private function log_webhook_event($event_type, $data) {
        // Créer un log simple pour les webhooks
        $log_entry = [
            'timestamp' => current_time('mysql'),
            'event_type' => $event_type,
            'data' => $data,
        ];

        // Stocker dans les options (pour un log simple)
        $existing_logs = get_option('bda_webhook_logs', []);

        // Garder seulement les 100 derniers logs
        if (count($existing_logs) >= 100) {
            $existing_logs = array_slice($existing_logs, -99);
        }

        $existing_logs[] = $log_entry;
        update_option('bda_webhook_logs', $existing_logs);

        // Déclencher une action pour permettre des logs personnalisés
        do_action('bda_webhook_logged', $event_type, $data);
    }

    public function check_webhook_permission($request) {
        $webhook_key = $request->get_header('X-BDA-Webhook-Key');

        if (empty($webhook_key)) {
            return false;
        }

        $valid_key = get_option('bda_portal_webhook_key', '');
        return !empty($valid_key) && hash_equals($valid_key, $webhook_key);
    }
}