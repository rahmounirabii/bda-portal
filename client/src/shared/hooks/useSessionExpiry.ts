/**
 * useSessionExpiry Hook
 * Handles session expiry events and provides user feedback
 * Integrates with toast notifications and navigation
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionManager, SessionEventType } from '@/services/session-manager.service';
import { useToast } from '@/hooks/use-toast';

export interface UseSessionExpiryOptions {
  /**
   * Callback when session expires
   * If not provided, defaults to redirect to /login
   */
  onSessionExpired?: () => void;

  /**
   * Callback when session warning is triggered (5 minutes before expiry)
   * If not provided, shows default toast notification
   */
  onSessionWarning?: (minutesRemaining: number) => void;

  /**
   * Callback when token refresh fails
   * If not provided, defaults to redirect to /login
   */
  onTokenRefreshFailed?: () => void;

  /**
   * Whether to show warning dialog before session expires
   * Default: true (shows toast notification)
   */
  showWarningDialog?: boolean;

  /**
   * Whether to automatically refresh session when warning is shown
   * Default: false (user must manually refresh)
   */
  autoRefreshOnWarning?: boolean;
}

/**
 * Hook to handle session expiry notifications and actions
 *
 * Usage:
 * ```tsx
 * // In App.tsx or layout component
 * useSessionExpiry({
 *   showWarningDialog: true,
 *   onSessionExpired: () => {
 *     // Optional custom handling
 *   }
 * });
 * ```
 */
export function useSessionExpiry(options: UseSessionExpiryOptions = {}) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    onSessionExpired,
    onSessionWarning,
    onTokenRefreshFailed,
    showWarningDialog = true,
    autoRefreshOnWarning = false,
  } = options;

  useEffect(() => {
    const handleSessionEvent = (event: SessionEventType, data?: any) => {
      console.log('🔔 [useSessionExpiry] Received event:', event, data);

      switch (event) {
        case 'SESSION_EXPIRED':
          // Show graceful expiry message
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please sign in again.',
            variant: 'destructive',
          });

          // Custom callback or default redirect
          if (onSessionExpired) {
            onSessionExpired();
          } else {
            // Default: redirect to login with state
            navigate('/login', {
              replace: true,
              state: { sessionExpired: true },
            });
          }
          break;

        case 'SESSION_WARNING':
          if (showWarningDialog) {
            const minutesRemaining = data?.minutesRemaining || 5;

            // Auto-refresh if enabled
            if (autoRefreshOnWarning) {
              console.log('🔄 [useSessionExpiry] Auto-refreshing session...');
              sessionManager.refreshSession().then(success => {
                if (success) {
                  toast({
                    title: 'Session Refreshed',
                    description: 'Your session has been automatically extended.',
                    variant: 'default',
                  });
                } else {
                  toast({
                    title: 'Session Expiring Soon',
                    description: `Your session will expire in ${minutesRemaining} minutes. Please save your work.`,
                    variant: 'default',
                  });
                }
              });
            } else {
              // Show warning toast
              toast({
                title: 'Session Expiring Soon',
                description: `Your session will expire in ${minutesRemaining} minutes. Please save your work.`,
                variant: 'default',
              });
            }
          }

          // Custom callback
          if (onSessionWarning) {
            onSessionWarning(data?.minutesRemaining || 5);
          }
          break;

        case 'TOKEN_REFRESH_FAILED':
          // Token refresh failed - likely session is invalid
          toast({
            title: 'Authentication Error',
            description: 'Failed to refresh your session. Please sign in again.',
            variant: 'destructive',
          });

          // Custom callback or default redirect
          if (onTokenRefreshFailed) {
            onTokenRefreshFailed();
          } else {
            navigate('/login', {
              replace: true,
              state: { tokenRefreshFailed: true },
            });
          }
          break;

        case 'MANUAL_LOGOUT':
          // No toast needed - user initiated logout
          console.log('👋 [useSessionExpiry] Manual logout detected (no notification needed)');
          break;

        case 'INACTIVITY_WARNING':
          // Warn user about inactivity
          const minutesRemaining = data?.minutesRemaining || 2;
          toast({
            title: 'Inactivity Warning',
            description: `You will be logged out in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} due to inactivity. Move your mouse or press any key to stay logged in.`,
            variant: 'default',
          });
          break;

        case 'INACTIVITY_LOGOUT':
          // User logged out due to inactivity
          toast({
            title: 'Logged Out',
            description: 'You have been logged out due to inactivity.',
            variant: 'destructive',
          });

          // Redirect to login
          navigate('/login', {
            replace: true,
            state: { inactivityLogout: true },
          });
          break;

        default:
          console.warn('⚠️ [useSessionExpiry] Unknown session event:', event);
      }
    };

    // Subscribe to session events
    const unsubscribe = sessionManager.subscribe(handleSessionEvent);

    console.log('✅ [useSessionExpiry] Hook initialized', {
      showWarningDialog,
      autoRefreshOnWarning,
    });

    // Cleanup on unmount
    return () => {
      console.log('🧹 [useSessionExpiry] Hook cleanup');
      unsubscribe();
    };
  }, [
    toast,
    navigate,
    onSessionExpired,
    onSessionWarning,
    onTokenRefreshFailed,
    showWarningDialog,
    autoRefreshOnWarning,
  ]);
}
