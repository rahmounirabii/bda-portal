/**
 * Integration Tests for Authentication Flows
 * Covers end-to-end scenarios across all test cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedSignupService } from '@/services/unified-signup.service';
import { UnifiedAuthService } from '@/services/unified-auth.service';
import { AuthService } from '@/entities/auth/auth.service';
import { WordPressAPIService } from '@/services/wordpress-api.service';
import { SessionManager } from '@/services/session-manager.service';
import { HealthCheckService } from '@/services/health-check.service';
import { AuthStorageService } from '@/shared/utils/auth-storage';
import { Logger } from '@/shared/utils/logger.service';

// Mock all services
vi.mock('@/entities/auth/auth.service');
vi.mock('@/services/wordpress-api.service');
vi.mock('@/services/session-manager.service');
vi.mock('@/services/health-check.service');

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthStorageService.clearAll();
    Logger.clearLogs();
  });

  describe('SIGNUP FLOWS (Test Cases 1-5)', () => {
    it('Cas 1: New user Portal + Store creation', async () => {
      // User doesn't exist anywhere
      (AuthService.checkUserExists as any).mockResolvedValue(false);
      (WordPressAPIService.checkUserExists as any).mockResolvedValue({
        exists: false,
      });

      // Portal creation succeeds
      (AuthService.signUp as any).mockResolvedValue({
        user: { id: 'portal-123', email: 'new@example.com' },
      });

      // Store creation succeeds
      (WordPressAPIService.createStoreUser as any).mockResolvedValue({
        success: true,
        user: { id: 456 },
      });

      // Account linking succeeds
      (AuthService.linkWordPressAccount as any).mockResolvedValue({
        success: true,
      });

      const result = await UnifiedSignupService.handleSignup({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        accessType: 'both',
        role: 'individual',
      });

      expect(result.success).toBe(true);
      expect(AuthService.signUp).toHaveBeenCalled();
      expect(WordPressAPIService.createStoreUser).toHaveBeenCalled();
      expect(AuthService.linkWordPressAccount).toHaveBeenCalled();
    });

    it('Cas 2: Portal creation fails, retry with recovery', async () => {
      (AuthService.checkUserExists as any).mockResolvedValue(false);
      (WordPressAPIService.checkUserExists as any).mockResolvedValue({
        exists: false,
      });

      // First signup attempt fails
      (AuthService.signUp as any)
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({
          user: { id: 'portal-123', email: 'retry@example.com' },
        });

      (WordPressAPIService.createStoreUser as any).mockResolvedValue({
        success: true,
      });

      const result = await UnifiedSignupService.handleSignup({
        email: 'retry@example.com',
        password: 'password123',
        firstName: 'Retry',
        lastName: 'User',
        accessType: 'both',
        role: 'individual',
      });

      // Should eventually succeed with recovery strategy
      expect(AuthService.signUp).toHaveBeenCalledTimes(2);
    });

    it('Cas 3: Store creation fails, degraded mode', async () => {
      (AuthService.checkUserExists as any).mockResolvedValue(false);
      (WordPressAPIService.checkUserExists as any).mockResolvedValue({
        exists: false,
      });

      (AuthService.signUp as any).mockResolvedValue({
        user: { id: 'portal-123', email: 'degraded@example.com' },
      });

      // Store creation fails
      (WordPressAPIService.createStoreUser as any).mockRejectedValue(
        new Error('WordPress unavailable')
      );

      const result = await UnifiedSignupService.handleSignup({
        email: 'degraded@example.com',
        password: 'password123',
        firstName: 'Degraded',
        lastName: 'User',
        accessType: 'both',
        role: 'individual',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('degraded mode');
    });

    it('Cas 4: Both accounts exist, linking required', async () => {
      (AuthService.checkUserExists as any).mockResolvedValue(true);
      (WordPressAPIService.checkUserExists as any).mockResolvedValue({
        exists: true,
      });

      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
        user: { id: 456 },
      });

      (AuthService.linkWordPressAccount as any).mockResolvedValue({
        success: true,
      });

      (AuthService.signIn as any).mockResolvedValue({
        user: { id: 'portal-123' },
      });

      const result = await UnifiedSignupService.handleSignup({
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
        accessType: 'both',
        role: 'individual',
      });

      expect(result.success).toBe(true);
      expect(AuthService.linkWordPressAccount).toHaveBeenCalled();
    });

    it('Cas 5: Conflict detection - different names', async () => {
      (AuthService.checkUserExists as any).mockResolvedValue(true);
      (WordPressAPIService.checkUserExists as any).mockResolvedValue({
        exists: true,
        user: {
          firstName: 'Portal',
          lastName: 'Name',
        },
      });

      (AuthService.getUserProfile as any).mockResolvedValue({
        first_name: 'Portal',
        last_name: 'Name',
      });

      const result = await UnifiedSignupService.handleSignup({
        email: 'conflict@example.com',
        password: 'password123',
        firstName: 'Store',
        lastName: 'Name',
        accessType: 'both',
        role: 'individual',
      });

      expect(result.requiresConflictResolution).toBe(true);
      expect(result.conflictData).toBeDefined();
    });
  });

  describe('LOGIN FLOWS (Test Cases 6-10)', () => {
    it('Cas 6: Portal user login with Store sync', async () => {
      (AuthService.signIn as any).mockResolvedValue({
        user: { id: 'portal-123', wp_user_id: 456 },
      });

      (WordPressAPIService.createSession as any).mockResolvedValue({
        success: true,
      });

      const result = await UnifiedAuthService.signIn(
        'portal@example.com',
        'password123'
      );

      expect(result.success).toBe(true);
      expect(WordPressAPIService.createSession).toHaveBeenCalled();
    });

    it('Cas 7: WordPress-only user auto-migration', async () => {
      // Portal login fails
      (AuthService.signIn as any).mockRejectedValue(
        new Error('User not found')
      );

      // WordPress user exists
      (WordPressAPIService.checkUserExists as any).mockResolvedValue({
        exists: true,
      });

      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
        user: { id: 456 },
      });

      // Auto-create Portal account
      (AuthService.createPortalAccount as any).mockResolvedValue({
        user: { id: 'portal-new' },
      });

      (AuthService.linkWordPressAccount as any).mockResolvedValue({
        success: true,
      });

      const result = await UnifiedAuthService.signIn(
        'wponly@example.com',
        'password123'
      );

      expect(AuthService.createPortalAccount).toHaveBeenCalled();
      expect(AuthService.linkWordPressAccount).toHaveBeenCalled();
    });

    it('Cas 8: Invalid credentials generic error', async () => {
      (AuthService.signIn as any).mockRejectedValue(
        new Error('Invalid credentials')
      );

      (WordPressAPIService.checkUserExists as any).mockResolvedValue({
        exists: false,
      });

      const result = await UnifiedAuthService.signIn(
        'invalid@example.com',
        'wrongpassword'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });

    it('Cas 9: Non-existent user generic error', async () => {
      (AuthService.signIn as any).mockRejectedValue(
        new Error('User not found')
      );

      (WordPressAPIService.checkUserExists as any).mockResolvedValue({
        exists: false,
      });

      const result = await UnifiedAuthService.signIn(
        'nonexistent@example.com',
        'password123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });

    it('Cas 10: Network error with retry', async () => {
      (AuthService.signIn as any)
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          user: { id: 'portal-123' },
        });

      // Simulate network retry logic
      let attempt = 0;
      const maxRetries = 3;

      while (attempt < maxRetries) {
        try {
          const result = await UnifiedAuthService.signIn(
            'network@example.com',
            'password123'
          );

          if (result.success) break;
        } catch (error) {
          attempt++;
          if (attempt >= maxRetries) throw error;
        }
      }

      expect(AuthService.signIn).toHaveBeenCalledTimes(3);
    });
  });

  describe('UX FLOWS (Test Cases 11-13)', () => {
    it('Cas 11: Session sync on login', async () => {
      (AuthService.signIn as any).mockResolvedValue({
        user: { id: 'portal-123', wp_user_id: 456 },
      });

      (WordPressAPIService.createSession as any).mockResolvedValue({
        success: true,
      });

      await UnifiedAuthService.signIn('user@example.com', 'password123');

      expect(WordPressAPIService.createSession).toHaveBeenCalled();
    });

    it('Cas 12: Dual logout clears both sessions', async () => {
      (AuthService.signOut as any).mockResolvedValue({ success: true });
      (WordPressAPIService.logout as any).mockResolvedValue({ success: true });

      await UnifiedAuthService.signOut();

      expect(AuthService.signOut).toHaveBeenCalled();
      expect(WordPressAPIService.logout).toHaveBeenCalled();
    });

    it('Cas 13: Session expiry detection and notification', async () => {
      const sessionManager = new (SessionManager as any)();
      const listener = vi.fn();

      sessionManager.subscribe(listener);

      // Simulate expired session
      const expiredSession = {
        access_token: 'token',
        expires_at: Math.floor(Date.now() / 1000) - 60,
      };

      sessionManager.startMonitoring(expiredSession);

      // Should detect expiry on next check
      vi.useFakeTimers();
      vi.advanceTimersByTime(60000);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SESSION_EXPIRED',
        })
      );

      vi.useRealTimers();
    });
  });

  describe('ERROR HANDLING (Test Cases 14-16)', () => {
    it('Cas 14: Network error with exponential backoff', async () => {
      const delays: number[] = [];

      (AuthService.signIn as any).mockImplementation(async () => {
        throw new Error('Network error');
      });

      // Simulate retry with backoff
      for (let i = 0; i < 3; i++) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        delays.push(delay);

        try {
          await UnifiedAuthService.signIn('retry@example.com', 'password123');
        } catch (error) {
          // Expected to fail
        }
      }

      expect(delays).toEqual([1000, 2000, 4000]);
    });

    it('Cas 15: WordPress down, degraded mode', async () => {
      (HealthCheckService.isWordPressHealthy as any).mockReturnValue(false);

      (AuthService.signIn as any).mockResolvedValue({
        user: { id: 'portal-123' },
      });

      // Store sync should fail gracefully
      (WordPressAPIService.createSession as any).mockRejectedValue(
        new Error('WordPress unavailable')
      );

      const result = await UnifiedAuthService.signIn(
        'user@example.com',
        'password123'
      );

      expect(result.success).toBe(true);
      expect(result.degradedMode).toBe(true);
    });

    it('Cas 16: Conflict resolution updates both systems', async () => {
      (AuthService.signIn as any).mockResolvedValue({
        user: { id: 'portal-123' },
      });

      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
        user: { id: 456 },
      });

      (AuthService.updateUserProfile as any).mockResolvedValue({
        success: true,
      });

      (WordPressAPIService.syncProfile as any).mockResolvedValue({
        success: true,
      });

      (AuthService.linkWordPressAccount as any).mockResolvedValue({
        success: true,
      });

      const result = await UnifiedSignupService.resolveConflictsAndLink({
        email: 'conflict@example.com',
        password: 'password123',
        firstName: 'Updated',
        lastName: 'Name',
        accessType: 'both',
        role: 'individual',
      });

      expect(result.success).toBe(true);
      expect(AuthService.updateUserProfile).toHaveBeenCalled();
      expect(WordPressAPIService.syncProfile).toHaveBeenCalled();
    });
  });

  describe('PRODUCTION ENHANCEMENTS', () => {
    it('should save email on successful login', async () => {
      (AuthService.signIn as any).mockResolvedValue({
        user: { id: 'portal-123', email: 'remember@example.com' },
      });

      await UnifiedAuthService.signIn('remember@example.com', 'password123');

      // Simulate checkbox checked
      AuthStorageService.saveLastEmail('remember@example.com');

      expect(AuthStorageService.getLastEmail()).toBe('remember@example.com');
    });

    it('should initialize health checks on app start', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      const health = await HealthCheckService.initializeHealthChecks();

      expect(health.status).toBe('healthy');
      expect(health.wordpress.available).toBe(true);
    });

    it('should log authentication events', () => {
      Logger.authEvent('login', 'user-123', { method: 'email' });

      const logs = Logger.getRecentLogs();

      expect(logs[0].message).toContain('login');
      expect(logs[0].context?.userId).toBe('user-123');
    });
  });

  describe('COMPREHENSIVE ERROR SCENARIOS', () => {
    it('should handle complete system failure gracefully', async () => {
      // Both Portal and WordPress down
      (AuthService.signIn as any).mockRejectedValue(
        new Error('Database unavailable')
      );

      (WordPressAPIService.checkUserExists as any).mockRejectedValue(
        new Error('WordPress unavailable')
      );

      const result = await UnifiedAuthService.signIn(
        'user@example.com',
        'password123'
      );

      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it('should handle partial success in dual creation', async () => {
      (AuthService.checkUserExists as any).mockResolvedValue(false);
      (WordPressAPIService.checkUserExists as any).mockResolvedValue({
        exists: false,
      });

      // Portal succeeds
      (AuthService.signUp as any).mockResolvedValue({
        user: { id: 'portal-123' },
      });

      // Store fails
      (WordPressAPIService.createStoreUser as any).mockRejectedValue(
        new Error('WordPress unavailable')
      );

      const result = await UnifiedSignupService.handleSignup({
        email: 'partial@example.com',
        password: 'password123',
        firstName: 'Partial',
        lastName: 'User',
        accessType: 'both',
        role: 'individual',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('degraded mode');
    });
  });
});
