/**
 * Configuration centralisée de l'application
 */

// Configuration de l'environnement
export const ENV = {
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
} as const;

// Configuration de l'application
export const APP_CONFIG = {
  name: 'BDA Portal',
  version: '1.0.0',
  description: 'Global Authority for Business Development Excellence',

  // URLs
  urls: {
    website: 'https://bda-global.org',
    support: 'https://bda-global.org/support',
    docs: 'https://docs.bda-global.org',
  },

  // Paramètres par défaut
  defaults: {
    language: 'en' as const,
    theme: 'light' as const,
    itemsPerPage: 20,
    timeout: 30000, // 30s
  },

  // Limites et contraintes
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxImageSize: 5 * 1024 * 1024, // 5MB
    passwordMinLength: 8,
    usernameMinLength: 3,
  },

  // Features flags
  features: {
    enableDebugMode: ENV.DEV,
    enableAnalytics: ENV.PROD,
    enableOfflineMode: false,
    enableDarkMode: true,
  },
} as const;

// Configuration spécifique aux rôles
export const ROLE_CONFIG = {
  individual: {
    name: 'Individual',
    permissions: ['view_profile', 'edit_profile', 'view_certifications'] as string[],
    defaultRoute: '/individual/dashboard',
  },
  ecp: {
    name: 'ECP Partner',
    permissions: ['manage_candidates', 'view_reports', 'manage_vouchers'] as string[],
    defaultRoute: '/ecp/dashboard',
  },
  pdp: {
    name: 'PDP Partner',
    permissions: ['manage_programs', 'view_reports', 'manage_profile'] as string[],
    defaultRoute: '/pdp/dashboard',
  },
  admin: {
    name: 'Administrator',
    permissions: ['*'] as string[], // Toutes les permissions
    defaultRoute: '/admin/dashboard',
  },
  super_admin: {
    name: 'Super Administrator',
    permissions: ['*'] as string[], // Toutes les permissions
    defaultRoute: '/admin/dashboard',
  },
} as const;

// Types pour la configuration
export type UserRole = keyof typeof ROLE_CONFIG;
export type Permission = string;
export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';