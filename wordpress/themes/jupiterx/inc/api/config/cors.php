<?php
/**
 * BDA Portal API - CORS Configuration
 *
 * Handles Cross-Origin Resource Sharing for API requests
 *
 * @package BDA_Portal
 * @subpackage API/Config
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Allowed origins for CORS
 */
function bda_get_allowed_origins() {
    return [
        'http://localhost:8082',
        'http://localhost:3000',
        'http://127.0.0.1:8082',
        'https://portal.bda-global.org',
        'https://bda-global.org'
    ];
}

// Preflight OPTIONS handling is done by mu-plugin

/**
 * Remove WordPress default wildcard CORS
 * This prevents the "*" that conflicts with the specific origin from mu-plugin
 */
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
});
