<?php
/**
 * BDA Portal API - Initialization
 *
 * Main entry point for the BDA Portal API
 * Loads all API components in the correct order
 *
 * @package BDA_Portal
 * @subpackage API
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define API directory
define('BDA_API_DIR', dirname(__FILE__));

// Load configuration
require_once BDA_API_DIR . '/config/cors.php';

// Load controllers
require_once BDA_API_DIR . '/controllers/AuthController.php';
require_once BDA_API_DIR . '/controllers/UsersController.php';
require_once BDA_API_DIR . '/controllers/WooCommerceController.php';
require_once BDA_API_DIR . '/controllers/VoucherAutomationController.php';

// Load routes
require_once BDA_API_DIR . '/routes/routes.php';
