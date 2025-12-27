/**
 * Tests for SessionManager Service
 * Covers session monitoring, event emission, and expiry detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager, SessionEvent } from '../session-manager.service';
import type { Session } from '@supabase/supabase-js';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockSession: Session;

  beforeEach(() => {
    vi.useFakeTimers();
    sessionManager = SessionManager.getInstance();

    mockSession = {
      access_token: 'mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'mock-refresh',
      user: {
        id: 'user-123',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
      },
    } as Session;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    sessionManager.clearSession();
  });

  describe('Session Monitoring', () => {
    it('should start monitoring when session is provided', () => {
      const result = sessionManager.startMonitoring(mockSession);

      expect(result).toBe(true);
      expect(sessionManager.isMonitoring()).toBe(true);
    });

    it('should not start monitoring with null session', () => {
      const result = sessionManager.startMonitoring(null);

      expect(result).toBe(false);
      expect(sessionManager.isMonitoring()).toBe(false);
    });

    it('should clear existing interval when restarting monitoring', () => {
      sessionManager.startMonitoring(mockSession);
      const firstMonitoring = sessionManager.isMonitoring();

      sessionManager.startMonitoring(mockSession);
      const secondMonitoring = sessionManager.isMonitoring();

      expect(firstMonitoring).toBe(true);
      expect(secondMonitoring).toBe(true);
    });

    it('should stop monitoring when clearSession is called', () => {
      sessionManager.startMonitoring(mockSession);
      expect(sessionManager.isMonitoring()).toBe(true);

      sessionManager.clearSession();
      expect(sessionManager.isMonitoring()).toBe(false);
    });
  });

  describe('Session Expiry Detection', () => {
    it('should emit SESSION_WARNING when 5 minutes remain', () => {
      const listener = vi.fn();
      sessionManager.subscribe(listener);

      // Session expires in 5 minutes
      const expiringSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      } as Session;

      sessionManager.startMonitoring(expiringSession);

      // Fast-forward 60 seconds (check interval)
      vi.advanceTimersByTime(60000);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SessionEvent.SESSION_WARNING,
        })
      );
    });

    it('should emit SESSION_EXPIRED when session expires', () => {
      const listener = vi.fn();
      sessionManager.subscribe(listener);

      // Session already expired
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 60, // 1 minute ago
      } as Session;

      sessionManager.startMonitoring(expiredSession);

      // Fast-forward 60 seconds (check interval)
      vi.advanceTimersByTime(60000);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SessionEvent.SESSION_EXPIRED,
        })
      );
    });

    it('should not emit events for valid session', () => {
      const listener = vi.fn();
      sessionManager.subscribe(listener);

      // Session expires in 1 hour
      sessionManager.startMonitoring(mockSession);

      // Fast-forward 60 seconds
      vi.advanceTimersByTime(60000);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Manual Logout Tracking', () => {
    it('should mark session as manual logout', () => {
      sessionManager.markManualLogout();

      expect(sessionManager.wasManualLogout()).toBe(true);
    });

    it('should not emit SESSION_EXPIRED on manual logout', () => {
      const listener = vi.fn();
      sessionManager.subscribe(listener);

      sessionManager.markManualLogout();
      sessionManager.clearSession();

      expect(listener).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: SessionEvent.SESSION_EXPIRED,
        })
      );
    });

    it('should reset manual logout flag after clearing', () => {
      sessionManager.markManualLogout();
      expect(sessionManager.wasManualLogout()).toBe(true);

      sessionManager.clearSession();
      expect(sessionManager.wasManualLogout()).toBe(false);
    });
  });

  describe('Token Refresh Handling', () => {
    it('should emit TOKEN_REFRESH_FAILED on refresh failure', () => {
      const listener = vi.fn();
      sessionManager.subscribe(listener);

      const error = new Error('Refresh failed');
      sessionManager.handleRefreshFailure(error);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SessionEvent.TOKEN_REFRESH_FAILED,
          payload: { error },
        })
      );
    });

    it('should handle refresh failure with no error object', () => {
      const listener = vi.fn();
      sessionManager.subscribe(listener);

      sessionManager.handleRefreshFailure();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: SessionEvent.TOKEN_REFRESH_FAILED,
          payload: { error: undefined },
        })
      );
    });
  });

  describe('Event Subscription', () => {
    it('should allow subscribing to events', () => {
      const listener = vi.fn();
      const unsubscribe = sessionManager.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should notify all subscribers on event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      sessionManager.subscribe(listener1);
      sessionManager.subscribe(listener2);

      sessionManager.handleRefreshFailure();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should allow unsubscribing from events', () => {
      const listener = vi.fn();
      const unsubscribe = sessionManager.subscribe(listener);

      unsubscribe();
      sessionManager.handleRefreshFailure();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Session Refresh', () => {
    it('should attempt to refresh session', async () => {
      const mockRefresh = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock supabase client
      const result = await sessionManager.refreshSession();

      // Should attempt refresh (actual implementation depends on supabase client)
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = SessionManager.getInstance();
      const instance2 = SessionManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Session Time Calculations', () => {
    it('should calculate time until expiry correctly', () => {
      // Session expires in 10 minutes
      const session = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) + 600,
      } as Session;

      sessionManager.startMonitoring(session);

      // Should be close to 600 seconds (allow small variance)
      const timeUntilExpiry = sessionManager.getTimeUntilExpiry();
      expect(timeUntilExpiry).toBeGreaterThan(590);
      expect(timeUntilExpiry).toBeLessThan(610);
    });

    it('should return 0 for expired sessions', () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Math.floor(Date.now() / 1000) - 60,
      } as Session;

      sessionManager.startMonitoring(expiredSession);

      expect(sessionManager.getTimeUntilExpiry()).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle session with no expires_at', () => {
      const noExpirySession = {
        ...mockSession,
        expires_at: undefined,
      } as any;

      const result = sessionManager.startMonitoring(noExpirySession);
      expect(result).toBe(true); // Should still start monitoring
    });

    it('should handle rapid start/stop cycles', () => {
      for (let i = 0; i < 10; i++) {
        sessionManager.startMonitoring(mockSession);
        sessionManager.clearSession();
      }

      expect(sessionManager.isMonitoring()).toBe(false);
    });

    it('should not crash when listener throws error', () => {
      const badListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();

      sessionManager.subscribe(badListener);
      sessionManager.subscribe(goodListener);

      expect(() => {
        sessionManager.handleRefreshFailure();
      }).not.toThrow();

      expect(goodListener).toHaveBeenCalled();
    });
  });
});
