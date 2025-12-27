<?php
/**
 * BDA Portal Validator
 * Validation utilities for portal-store data
 */

if (!defined('ABSPATH')) {
    exit;
}

class BDA_Portal_Validator {

    /**
     * Validate email address
     */
    public static function validate_email($email) {
        $email = sanitize_email($email);

        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Invalid email format');
        }

        return $email;
    }

    /**
     * Validate BDA role
     */
    public static function validate_bda_role($role) {
        $valid_roles = ['individual', 'member', 'moderator', 'admin', 'super_admin'];

        if (!in_array($role, $valid_roles)) {
            return new WP_Error('invalid_role', 'Invalid BDA role');
        }

        return $role;
    }

    /**
     * Validate user data for creation
     */
    public static function validate_user_creation_data($data) {
        $errors = [];

        // Required fields
        $required_fields = ['email', 'password'];
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                $errors[] = "Missing required field: {$field}";
            }
        }

        // Email validation
        if (!empty($data['email'])) {
            $email_validation = self::validate_email($data['email']);
            if (is_wp_error($email_validation)) {
                $errors[] = $email_validation->get_error_message();
            }
        }

        // Password validation
        if (!empty($data['password']) && strlen($data['password']) < 8) {
            $errors[] = 'Password must be at least 8 characters long';
        }

        // Role validation
        if (!empty($data['bda_role'])) {
            $role_validation = self::validate_bda_role($data['bda_role']);
            if (is_wp_error($role_validation)) {
                $errors[] = $role_validation->get_error_message();
            }
        }

        if (!empty($errors)) {
            return new WP_Error('validation_failed', 'Validation failed', $errors);
        }

        return true;
    }

    /**
     * Validate API key format
     */
    public static function validate_api_key($key) {
        if (empty($key)) {
            return new WP_Error('missing_api_key', 'API key is required');
        }

        if (strlen($key) < 32) {
            return new WP_Error('invalid_api_key', 'API key must be at least 32 characters');
        }

        if (!ctype_alnum($key)) {
            return new WP_Error('invalid_api_key', 'API key must contain only alphanumeric characters');
        }

        return $key;
    }

    /**
     * Sanitize user data
     */
    public static function sanitize_user_data($data) {
        $sanitized = [];

        $text_fields = ['first_name', 'last_name', 'company', 'bda_organization', 'phone'];
        $email_fields = ['email'];
        $role_fields = ['bda_role'];

        foreach ($data as $key => $value) {
            if (in_array($key, $text_fields)) {
                $sanitized[$key] = sanitize_text_field($value);
            } elseif (in_array($key, $email_fields)) {
                $sanitized[$key] = sanitize_email($value);
            } elseif (in_array($key, $role_fields)) {
                $sanitized[$key] = sanitize_text_field($value);
            } elseif ($key === 'bda_portal_preferences' && is_array($value)) {
                $sanitized[$key] = self::sanitize_preferences($value);
            } else {
                $sanitized[$key] = sanitize_text_field($value);
            }
        }

        return $sanitized;
    }

    /**
     * Sanitize preferences data
     */
    public static function sanitize_preferences($preferences) {
        $sanitized = [];
        $allowed_keys = [
            'language',
            'timezone',
            'notifications_email',
            'notifications_push',
            'theme',
            'dashboard_layout',
        ];

        foreach ($preferences as $key => $value) {
            if (in_array($key, $allowed_keys)) {
                $sanitized[$key] = sanitize_text_field($value);
            }
        }

        return $sanitized;
    }

    /**
     * Validate webhook payload
     */
    public static function validate_webhook_payload($payload) {
        if (!is_array($payload)) {
            return new WP_Error('invalid_payload', 'Payload must be an array');
        }

        $required_fields = ['event_type', 'data', 'timestamp'];
        foreach ($required_fields as $field) {
            if (!isset($payload[$field])) {
                return new WP_Error('missing_field', "Missing required field: {$field}");
            }
        }

        $valid_event_types = [
            'user_created',
            'user_updated',
            'profile_updated',
            'role_changed',
            'user_login',
            'user_logout',
        ];

        if (!in_array($payload['event_type'], $valid_event_types)) {
            return new WP_Error('invalid_event_type', 'Invalid event type');
        }

        return true;
    }

    /**
     * Validate sync data
     */
    public static function validate_sync_data($data, $sync_type = 'user') {
        switch ($sync_type) {
            case 'user':
                return self::validate_user_sync_data($data);
            case 'profile':
                return self::validate_profile_sync_data($data);
            default:
                return new WP_Error('invalid_sync_type', 'Invalid sync type');
        }
    }

    /**
     * Validate user sync data
     */
    private static function validate_user_sync_data($data) {
        if (!isset($data['wp_user_id']) || !is_numeric($data['wp_user_id'])) {
            return new WP_Error('invalid_user_id', 'Valid user ID is required');
        }

        if (!isset($data['email']) || !is_email($data['email'])) {
            return new WP_Error('invalid_email', 'Valid email is required');
        }

        return true;
    }

    /**
     * Validate profile sync data
     */
    private static function validate_profile_sync_data($data) {
        if (!isset($data['wp_user_id']) || !is_numeric($data['wp_user_id'])) {
            return new WP_Error('invalid_user_id', 'Valid user ID is required');
        }

        // Valider les champs optionnels s'ils sont présents
        if (isset($data['bda_role'])) {
            $role_validation = self::validate_bda_role($data['bda_role']);
            if (is_wp_error($role_validation)) {
                return $role_validation;
            }
        }

        return true;
    }

    /**
     * Check if user exists
     */
    public static function user_exists($identifier, $by = 'id') {
        $user = false;

        switch ($by) {
            case 'id':
                $user = get_user_by('ID', $identifier);
                break;
            case 'email':
                $user = get_user_by('email', $identifier);
                break;
            case 'login':
                $user = get_user_by('login', $identifier);
                break;
        }

        return $user !== false;
    }

    /**
     * Validate organization name
     */
    public static function validate_organization($organization) {
        if (empty($organization)) {
            return true; // Organization is optional
        }

        $organization = sanitize_text_field($organization);

        if (strlen($organization) < 2) {
            return new WP_Error('invalid_organization', 'Organization name must be at least 2 characters');
        }

        if (strlen($organization) > 100) {
            return new WP_Error('invalid_organization', 'Organization name must be less than 100 characters');
        }

        return $organization;
    }

    /**
     * Validate phone number
     */
    public static function validate_phone($phone) {
        if (empty($phone)) {
            return true; // Phone is optional
        }

        $phone = sanitize_text_field($phone);

        // Simple phone validation - adjust regex as needed
        if (!preg_match('/^[\+]?[0-9\s\-\(\)]{7,20}$/', $phone)) {
            return new WP_Error('invalid_phone', 'Invalid phone number format');
        }

        return $phone;
    }

    /**
     * Rate limiting validation
     */
    public static function check_rate_limit($identifier, $max_requests = 100, $time_window = 3600) {
        $cache_key = "bda_rate_limit_{$identifier}";
        $requests = get_transient($cache_key) ?: 0;

        if ($requests >= $max_requests) {
            return new WP_Error('rate_limit_exceeded', 'Rate limit exceeded. Please try again later.');
        }

        set_transient($cache_key, $requests + 1, $time_window);
        return true;
    }
}