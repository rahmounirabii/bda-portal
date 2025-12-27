/**
 * Session Manager Service
 * Monitors session expiry, token refresh, and manages session-related events
 * Distinguishes between manual logout and automatic session expiry
 */

import { supabase } from '@/shared/config/supabase.config';
import type { Session } from '@supabase/supabase-js';

export type SessionEventType =
  | 'SESSION_EXPIRED'
  | 'SESSION_WARNING'
  | 'TOKEN_REFRESH_FAILED'
  | 'MANUAL_LOGOUT'
  | 'INACTIVITY_WARNING'
  | 'INACTIVITY_LOGOUT';

export interface SessionEventListener {
  (event: SessionEventType, data?: any): void;
}

export interface SessionEventData {
  expiresAt?: number;
  minutesRemaining?: number;
  error?: any;
}

class SessionManager {
  private listeners: SessionEventListener[] = [];
  private warningTimer: NodeJS.Timeout | null = null;
  private expiryCheckTimer: NodeJS.Timeout | null = null;
  private lastSession: Session | null = null;
  private isManualLogout = false;

  // Inactivity tracking
  private inactivityTimer: NodeJS.Timeout | null = null;
  private inactivityWarningTimer: NodeJS.Timeout | null = null;
  private lastActivityTime: number = Date.now();
  private activityListenersAttached = false;

  // Constants - Warning 5 minutes before expiry, check every minute
  private readonly WARNING_BEFORE_EXPIRY = 5 * 60 * 1000; // 5 minutes in ms
  private readonly CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

  // Inactivity constants - 30 minutes of inactivity, warning 2 minutes before
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms
  private readonly INACTIVITY_WARNING_BEFORE = 2 * 60 * 1000; // 2 minutes before logout

  /**
   * Initialize session monitoring
   * Called when user signs in or session is refreshed
   */
  startMonitoring(session: Session | null): void {
    if (!session) {
      console.log('🔒 [SessionManager] No session to monitor');
      this.cleanup();
      return;
    }

    console.log('🔐 [SessionManager] Starting session monitoring', {
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
    });

    this.lastSession = session;
    this.scheduleExpiryWarning(session);
    this.startExpiryCheck();
    this.startInactivityTracking();

    // Reset manual logout flag when starting new session
    this.isManualLogout = false;
  }

  /**
   * Schedule warning notification before session expires
   */
  private scheduleExpiryWarning(session: Session): void {
    this.clearWarningTimer();

    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const now = Date.now();
    const timeUntilWarning = expiresAt - now - this.WARNING_BEFORE_EXPIRY;

    if (timeUntilWarning > 0 && expiresAt > 0) {
      console.log('⏰ [SessionManager] Scheduling expiry warning in', Math.round(timeUntilWarning / 1000), 'seconds');

      this.warningTimer = setTimeout(() => {
        console.warn('⚠️ [SessionManager] Session expiring soon');
        this.notifyListeners('SESSION_WARNING', {
          expiresAt,
          minutesRemaining: 5
        });
      }, timeUntilWarning);
    } else if (timeUntilWarning <= 0 && expiresAt > now) {
      // Session expires in less than 5 minutes
      const minutesRemaining = Math.ceil((expiresAt - now) / 60000);
      console.warn('⚠️ [SessionManager] Session expires soon (', minutesRemaining, 'min)');
    }
  }

  /**
   * Periodically check if session has expired
   */
  private startExpiryCheck(): void {
    this.clearExpiryCheckTimer();

    console.log('🔍 [SessionManager] Starting periodic session checks (every', this.CHECK_INTERVAL / 1000, 's)');

    this.expiryCheckTimer = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ [SessionManager] Error checking session:', error);
          return;
        }

        // Session expired (was valid, now null)
        if (this.lastSession && !session && !this.isManualLogout) {
          console.error('❌ [SessionManager] Session expired (automatic)');
          this.notifyListeners('SESSION_EXPIRED');
          this.cleanup();
        } else if (this.lastSession && session) {
          // Session still valid, update last session
          this.lastSession = session;
        }
      } catch (error) {
        console.error('❌ [SessionManager] Exception during session check:', error);
      }
    }, this.CHECK_INTERVAL);
  }

  /**
   * Mark logout as manual (user-initiated)
   * Call this BEFORE calling signOut() to prevent "session expired" message
   */
  markManualLogout(): void {
    console.log('👋 [SessionManager] Marking logout as manual');
    this.isManualLogout = true;
    this.cleanup();
  }

  /**
   * Handle token refresh failure
   * Called when TOKEN_REFRESHED event fires but session is null
   */
  handleRefreshFailure(error: any): void {
    console.error('❌ [SessionManager] Token refresh failed:', error);
    this.notifyListeners('TOKEN_REFRESH_FAILED', { error });
  }

  /**
   * Manually refresh the session to extend it
   * Returns true if refresh succeeded, false otherwise
   */
  async refreshSession(): Promise<boolean> {
    try {
      console.log('🔄 [SessionManager] Manually refreshing session...');

      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        console.error('❌ [SessionManager] Manual refresh failed:', error);
        this.handleRefreshFailure(error);
        return false;
      }

      console.log('✅ [SessionManager] Session refreshed successfully');
      this.startMonitoring(data.session);
      return true;
    } catch (error) {
      console.error('❌ [SessionManager] Exception during manual refresh:', error);
      this.handleRefreshFailure(error);
      return false;
    }
  }

  /**
   * Subscribe to session events
   * Returns unsubscribe function
   */
  subscribe(listener: SessionEventListener): () => void {
    console.log('🎧 [SessionManager] New listener subscribed (total:', this.listeners.length + 1, ')');
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      console.log('🎧 [SessionManager] Listener unsubscribed (remaining:', this.listeners.length, ')');
    };
  }

  /**
   * Notify all listeners of a session event
   */
  private notifyListeners(event: SessionEventType, data?: SessionEventData): void {
    console.log('📢 [SessionManager] Notifying', this.listeners.length, 'listeners of event:', event, data);

    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('❌ [SessionManager] Error in listener:', error);
      }
    });
  }

  /**
   * Start inactivity tracking
   * Attaches event listeners to detect user activity
   */
  private startInactivityTracking(): void {
    // Attach activity listeners if not already attached
    if (!this.activityListenersAttached && typeof window !== 'undefined') {
      console.log('👂 [SessionManager] Attaching activity listeners');

      const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
      activityEvents.forEach(event => {
        window.addEventListener(event, this.handleUserActivity, { passive: true });
      });

      this.activityListenersAttached = true;
    }

    // Reset activity time
    this.lastActivityTime = Date.now();

    // Schedule inactivity warning and logout
    this.scheduleInactivityTimers();
  }

  /**
   * Handle user activity - resets inactivity timers
   */
  private handleUserActivity = (): void => {
    this.lastActivityTime = Date.now();
    this.scheduleInactivityTimers();
  };

  /**
   * Schedule inactivity warning and logout timers
   */
  private scheduleInactivityTimers(): void {
    // Clear existing timers
    this.clearInactivityTimers();

    // Schedule warning timer (28 minutes)
    const warningTime = this.INACTIVITY_TIMEOUT - this.INACTIVITY_WARNING_BEFORE;
    this.inactivityWarningTimer = setTimeout(() => {
      const minutesUntilLogout = Math.floor(this.INACTIVITY_WARNING_BEFORE / 60000);
      console.warn('⚠️ [SessionManager] Inactivity warning - logout in', minutesUntilLogout, 'minutes');
      this.notifyListeners('INACTIVITY_WARNING', { minutesRemaining: minutesUntilLogout });
    }, warningTime);

    // Schedule logout timer (30 minutes)
    this.inactivityTimer = setTimeout(() => {
      console.warn('❌ [SessionManager] Inactivity timeout - logging out');
      this.handleInactivityLogout();
    }, this.INACTIVITY_TIMEOUT);
  }

  /**
   * Handle inactivity logout
   */
  private async handleInactivityLogout(): Promise<void> {
    console.log('🚪 [SessionManager] Logging out due to inactivity');
    this.notifyListeners('INACTIVITY_LOGOUT');

    // Mark as manual logout to prevent double notifications
    this.isManualLogout = true;

    // Sign out from Supabase
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ [SessionManager] Error during inactivity logout:', error);
    }

    this.cleanup();
  }

  /**
   * Clear inactivity timers
   */
  private clearInactivityTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.inactivityWarningTimer) {
      clearTimeout(this.inactivityWarningTimer);
      this.inactivityWarningTimer = null;
    }
  }

  /**
   * Detach activity event listeners
   */
  private detachActivityListeners(): void {
    if (this.activityListenersAttached && typeof window !== 'undefined') {
      console.log('👂 [SessionManager] Detaching activity listeners');

      const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
      activityEvents.forEach(event => {
        window.removeEventListener(event, this.handleUserActivity);
      });

      this.activityListenersAttached = false;
    }
  }

  /**
   * Cleanup timers and state
   */
  private cleanup(): void {
    console.log('🧹 [SessionManager] Cleaning up session monitoring');
    this.clearWarningTimer();
    this.clearExpiryCheckTimer();
    this.clearInactivityTimers();
    this.detachActivityListeners();
    this.lastSession = null;
  }

  /**
   * Clear warning timer
   */
  private clearWarningTimer(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Clear expiry check timer
   */
  private clearExpiryCheckTimer(): void {
    if (this.expiryCheckTimer) {
      clearInterval(this.expiryCheckTimer);
      this.expiryCheckTimer = null;
    }
  }

  /**
   * Reset manual logout flag
   * Useful for testing or recovery scenarios
   */
  resetManualLogoutFlag(): void {
    console.log('🔄 [SessionManager] Resetting manual logout flag');
    this.isManualLogout = false;
  }

  /**
   * Get current session monitoring status (for debugging)
   */
  getStatus(): {
    isMonitoring: boolean;
    hasWarningScheduled: boolean;
    isManualLogout: boolean;
    listenerCount: number;
  } {
    return {
      isMonitoring: this.expiryCheckTimer !== null,
      hasWarningScheduled: this.warningTimer !== null,
      isManualLogout: this.isManualLogout,
      listenerCount: this.listeners.length,
    };
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Export class for type purposes
export type { SessionManager };
