/**
 * API Configuration
 * Centralized configuration for WordPress and other API endpoints
 */

export const API_CONFIG = {
  // WordPress Store API
  wordpress: {
    baseURL: import.meta.env.VITE_WORDPRESS_API_URL || 'http://localhost/wp-json/bda-portal/v1',
    apiKey: import.meta.env.VITE_WORDPRESS_API_KEY || '',
    adminKey: import.meta.env.VITE_WORDPRESS_ADMIN_KEY || '',
    webhookKey: import.meta.env.VITE_WORDPRESS_WEBHOOK_KEY || '',
  },

  // Portal settings
  portal: {
    baseURL: import.meta.env.VITE_PORTAL_BASE_URL || 'http://localhost:8082',
    webhookURL: import.meta.env.VITE_PORTAL_WEBHOOK_URL || '',
  },

  // Timeouts and retry settings
  network: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  // Feature flags
  features: {
    enableStoreSync: import.meta.env.VITE_ENABLE_STORE_SYNC !== 'false',
    enableLogging: import.meta.env.VITE_ENABLE_LOGGING !== 'false',
    enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
  },
};

/**
 * Initialize API configuration with runtime values
 */
export function initializeAPIConfig() {
  // Auto-detect WordPress URL in development
  if (import.meta.env.MODE === 'development' && !API_CONFIG.wordpress.baseURL) {
    // Try common WordPress local URLs
    const possibleURLs = [
      'http://localhost/wp-json/bda-portal/v1',
      'http://localhost:8080/wp-json/bda-portal/v1',
      'http://localhost:8000/wp-json/bda-portal/v1',
    ];

    API_CONFIG.wordpress.baseURL = possibleURLs[0];
  }

  // Log configuration in development
  if (import.meta.env.MODE === 'development') {
    console.log('API Configuration:', {
      wordpress: {
        baseURL: API_CONFIG.wordpress.baseURL,
        hasApiKey: !!API_CONFIG.wordpress.apiKey,
      },
      portal: API_CONFIG.portal,
      features: API_CONFIG.features,
    });
  }
}

/**
 * Update API configuration at runtime
 */
export function updateAPIConfig(updates: Partial<typeof API_CONFIG>) {
  Object.assign(API_CONFIG, updates);
}

// Initialize on import
initializeAPIConfig();