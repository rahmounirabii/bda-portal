/**
 * Shared UI Components - Barrel Export
 *
 * Reusable UI components used across the application
 */

// Existing components
export { LoadingSpinner } from './LoadingSpinner';
export { PermissionGate } from './PermissionGate';
export { ProtectedRoute } from './ProtectedRoute';

// Role & Permission Guards
export { RoleGuard, type RoleGuardProps } from './RoleGuard';
export { PermissionGuard, type PermissionGuardProps } from './PermissionGuard';

// New Quiz & Support components
export { StatusBadge, type StatusBadgeProps } from './StatusBadge';
export { Timer, useTimer, type TimerProps } from './Timer';
export { FileUploader, type FileUploaderProps, type UploadedFile, type FileWithPreview } from './FileUploader';
