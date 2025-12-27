<?php
/**
 * BDA Portal API Router
 * Routes all API requests to appropriate endpoints
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_Portal_API_Router {

    private static $instance = null;
    private $endpoints = [];

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        $this->load_endpoints();
    }

    private function load_endpoints() {
        require_once get_template_directory() . '/inc/bda-portal-api/endpoints/class-auth-endpoint.php';
        require_once get_template_directory() . '/inc/bda-portal-api/endpoints/class-user-sync-endpoint.php';
        require_once get_template_directory() . '/inc/bda-portal-api/endpoints/class-profile-endpoint.php';
        require_once get_template_directory() . '/inc/bda-portal-api/endpoints/class-webhook-endpoint.php';

        $this->endpoints = [
            new BDA_Auth_Endpoint(),
            new BDA_User_Sync_Endpoint(),
            new BDA_Profile_Endpoint(),
            new BDA_Webhook_Endpoint(),
        ];
    }

    public function register_routes() {
        foreach ($this->endpoints as $endpoint) {
            $endpoint->register_routes();
        }
    }
}