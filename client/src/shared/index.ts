/**
 * Point d'entrée pour tous les exports partagés
 * Simplifie les imports dans l'application
 */

// Types
export type * from './types/auth.types';
export * from './types/roles.types';

// Configuration
// Note: app.config a des conflits avec roles.types, import directement si nécessaire
// export * from './config/app.config';
export * from './config/supabase.config';

// Constantes
export * from './constants/routes';

// Utilitaires
// Note: permissions.utils a des conflits avec roles.types, import directement si nécessaire
// export * from './utils/permissions.utils';
export * from './utils/validation.utils';

// Hooks
// Note: Export sélectif pour éviter les conflits
export { useAuth } from './hooks/useAuth';
export { usePermissions, useRole } from './hooks/usePermissions';

// Composants UI
export * from './ui/ProtectedRoute';
export * from './ui/LoadingSpinner';
export * from './ui/PermissionGate';
export * from './ui/RoleGuard';
export * from './ui/PermissionGuard';

// Providers
export * from '../app/providers/AuthProvider';