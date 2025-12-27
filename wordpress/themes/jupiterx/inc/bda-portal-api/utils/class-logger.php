<?php
/**
 * BDA Portal Logger
 * Centralized logging for portal-store synchronization
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_Portal_Logger {

    private static $instance = null;
    private $log_levels = [
        'emergency' => 0,
        'alert' => 1,
        'critical' => 2,
        'error' => 3,
        'warning' => 4,
        'notice' => 5,
        'info' => 6,
        'debug' => 7,
    ];

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Hook pour nettoyer les anciens logs
        add_action('wp_scheduled_delete', [$this, 'cleanup_old_logs']);
    }

    /**
     * Log a message
     */
    public function log($level, $message, $context = []) {
        if (!$this->should_log($level)) {
            return false;
        }

        $log_entry = [
            'timestamp' => current_time('mysql'),
            'level' => $level,
            'message' => $message,
            'context' => $context,
            'user_id' => get_current_user_id(),
            'ip_address' => $this->get_client_ip(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        ];

        $this->write_log($log_entry);

        // Pour les erreurs critiques, notifier immédiatement
        if (in_array($level, ['emergency', 'alert', 'critical', 'error'])) {
            do_action('bda_portal_error_logged', $log_entry);
        }

        return true;
    }

    /**
     * Convenience methods for different log levels
     */
    public function emergency($message, $context = []) {
        return $this->log('emergency', $message, $context);
    }

    public function alert($message, $context = []) {
        return $this->log('alert', $message, $context);
    }

    public function critical($message, $context = []) {
        return $this->log('critical', $message, $context);
    }

    public function error($message, $context = []) {
        return $this->log('error', $message, $context);
    }

    public function warning($message, $context = []) {
        return $this->log('warning', $message, $context);
    }

    public function notice($message, $context = []) {
        return $this->log('notice', $message, $context);
    }

    public function info($message, $context = []) {
        return $this->log('info', $message, $context);
    }

    public function debug($message, $context = []) {
        return $this->log('debug', $message, $context);
    }

    /**
     * Log API requests
     */
    public function log_api_request($endpoint, $method, $request_data, $response_data, $status_code) {
        $this->info('API Request', [
            'endpoint' => $endpoint,
            'method' => $method,
            'request_data' => $request_data,
            'response_data' => $response_data,
            'status_code' => $status_code,
            'execution_time' => $this->get_execution_time(),
        ]);
    }

    /**
     * Log user synchronization events
     */
    public function log_user_sync($event_type, $user_id, $data) {
        $this->info('User Sync Event', [
            'event_type' => $event_type,
            'user_id' => $user_id,
            'data' => $data,
        ]);
    }

    /**
     * Log authentication events
     */
    public function log_auth_event($event_type, $user_id, $details = []) {
        $this->info('Auth Event', [
            'event_type' => $event_type,
            'user_id' => $user_id,
            'details' => $details,
        ]);
    }

    /**
     * Check if we should log this level
     */
    private function should_log($level) {
        $min_level = get_option('bda_portal_log_level', 'info');
        $min_level_value = $this->log_levels[$min_level] ?? 6;
        $current_level_value = $this->log_levels[$level] ?? 7;

        return $current_level_value <= $min_level_value;
    }

    /**
     * Write log to storage
     */
    private function write_log($log_entry) {
        // Stocker dans la base de données
        $this->store_in_database($log_entry);

        // Écrire dans le fichier de log WordPress si c'est une erreur
        if (in_array($log_entry['level'], ['emergency', 'alert', 'critical', 'error'])) {
            error_log(sprintf(
                '[BDA Portal %s] %s - Context: %s',
                strtoupper($log_entry['level']),
                $log_entry['message'],
                json_encode($log_entry['context'])
            ));
        }
    }

    /**
     * Store log in database
     */
    private function store_in_database($log_entry) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'bda_portal_logs';

        // Créer la table si elle n'existe pas
        $this->maybe_create_log_table();

        $wpdb->insert(
            $table_name,
            [
                'timestamp' => $log_entry['timestamp'],
                'level' => $log_entry['level'],
                'message' => $log_entry['message'],
                'context' => json_encode($log_entry['context']),
                'user_id' => $log_entry['user_id'],
                'ip_address' => $log_entry['ip_address'],
                'user_agent' => $log_entry['user_agent'],
            ],
            [
                '%s', // timestamp
                '%s', // level
                '%s', // message
                '%s', // context
                '%d', // user_id
                '%s', // ip_address
                '%s', // user_agent
            ]
        );
    }

    /**
     * Create log table if it doesn't exist
     */
    private function maybe_create_log_table() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'bda_portal_logs';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            timestamp datetime DEFAULT CURRENT_TIMESTAMP,
            level varchar(20) NOT NULL,
            message text NOT NULL,
            context longtext,
            user_id bigint(20),
            ip_address varchar(45),
            user_agent text,
            PRIMARY KEY (id),
            KEY level (level),
            KEY timestamp (timestamp),
            KEY user_id (user_id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * Get recent logs
     */
    public function get_recent_logs($limit = 100, $level = null) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'bda_portal_logs';

        $where_clause = '';
        if ($level) {
            $where_clause = $wpdb->prepare("WHERE level = %s", $level);
        }

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name $where_clause ORDER BY timestamp DESC LIMIT %d",
            $limit
        ));

        // Décoder le contexte JSON
        foreach ($results as $result) {
            $result->context = json_decode($result->context, true);
        }

        return $results;
    }

    /**
     * Clean up old logs
     */
    public function cleanup_old_logs() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'bda_portal_logs';
        $retention_days = get_option('bda_portal_log_retention_days', 30);

        $wpdb->query($wpdb->prepare(
            "DELETE FROM $table_name WHERE timestamp < DATE_SUB(NOW(), INTERVAL %d DAY)",
            $retention_days
        ));
    }

    /**
     * Get client IP address
     */
    private function get_client_ip() {
        $ip_keys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];

        foreach ($ip_keys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                foreach (explode(',', $_SERVER[$key]) as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                        return $ip;
                    }
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    /**
     * Get execution time
     */
    private function get_execution_time() {
        if (defined('REQUEST_TIME_FLOAT')) {
            return microtime(true) - REQUEST_TIME_FLOAT;
        }
        return null;
    }

    /**
     * Get log statistics
     */
    public function get_log_stats($days = 7) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'bda_portal_logs';

        $stats = $wpdb->get_results($wpdb->prepare(
            "SELECT
                level,
                COUNT(*) as count,
                DATE(timestamp) as date
            FROM $table_name
            WHERE timestamp >= DATE_SUB(NOW(), INTERVAL %d DAY)
            GROUP BY level, DATE(timestamp)
            ORDER BY timestamp DESC",
            $days
        ));

        return $stats;
    }
}