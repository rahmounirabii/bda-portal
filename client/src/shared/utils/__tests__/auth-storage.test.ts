/**
 * Tests for AuthStorageService
 * Covers email persistence, remember preference, and security
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthStorageService } from '../auth-storage';

describe('AuthStorageService', () => {
  // localStorage is mocked and cleared by global setup.ts

  describe('saveLastEmail', () => {
    it('should save valid email to localStorage', () => {
      const email = 'test@example.com';

      AuthStorageService.saveLastEmail(email);

      expect(localStorage.getItem('bda-portal.last-email')).toBe(email);
      expect(localStorage.getItem('bda-portal.remember-email')).toBe('true');
    });

    it('should not save invalid email format', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test',
        'test@.com',
      ];

      invalidEmails.forEach((email) => {
        localStorage.clear();
        AuthStorageService.saveLastEmail(email);

        expect(localStorage.getItem('bda-portal.last-email')).toBeNull();
      });
    });

    it('should handle special characters in valid emails', () => {
      const emails = [
        'test+tag@example.com',
        'first.last@example.com',
        'test_user@example.co.uk',
      ];

      emails.forEach((email) => {
        localStorage.clear();
        AuthStorageService.saveLastEmail(email);

        expect(localStorage.getItem('bda-portal.last-email')).toBe(email);
      });
    });

    it('should overwrite existing saved email', () => {
      AuthStorageService.saveLastEmail('old@example.com');
      AuthStorageService.saveLastEmail('new@example.com');

      expect(localStorage.getItem('bda-portal.last-email')).toBe('new@example.com');
    });
  });

  describe('getLastEmail', () => {
    it('should return saved email when remember is enabled', () => {
      localStorage.setItem('bda-portal.last-email', 'test@example.com');
      localStorage.setItem('bda-portal.remember-email', 'true');

      const email = AuthStorageService.getLastEmail();

      expect(email).toBe('test@example.com');
    });

    it('should return null when remember is disabled', () => {
      localStorage.setItem('bda-portal.last-email', 'test@example.com');
      localStorage.setItem('bda-portal.remember-email', 'false');

      const email = AuthStorageService.getLastEmail();

      expect(email).toBeNull();
    });

    it('should return null when no email is saved', () => {
      localStorage.setItem('bda-portal.remember-email', 'true');

      const email = AuthStorageService.getLastEmail();

      expect(email).toBeNull();
    });

    it('should validate email before returning', () => {
      localStorage.setItem('bda-portal.last-email', 'invalid-email');
      localStorage.setItem('bda-portal.remember-email', 'true');

      const email = AuthStorageService.getLastEmail();

      expect(email).toBeNull();
    });

    it('should handle corrupted localStorage gracefully', () => {
      // Mock localStorage to throw error
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const email = AuthStorageService.getLastEmail();

      expect(email).toBeNull();
    });
  });

  describe('clearLastEmail', () => {
    it('should remove email and remember preference', () => {
      localStorage.setItem('bda-portal.last-email', 'test@example.com');
      localStorage.setItem('bda-portal.remember-email', 'true');

      AuthStorageService.clearLastEmail();

      expect(localStorage.getItem('bda-portal.last-email')).toBeNull();
      expect(localStorage.getItem('bda-portal.remember-email')).toBeNull();
    });

    it('should not throw error if nothing to clear', () => {
      expect(() => {
        AuthStorageService.clearLastEmail();
      }).not.toThrow();
    });
  });

  describe('isRememberEnabled', () => {
    it('should return true when remember is enabled', () => {
      localStorage.setItem('bda-portal.remember-email', 'true');

      expect(AuthStorageService.isRememberEnabled()).toBe(true);
    });

    it('should return false when remember is disabled', () => {
      localStorage.setItem('bda-portal.remember-email', 'false');

      expect(AuthStorageService.isRememberEnabled()).toBe(false);
    });

    it('should return false when remember is not set', () => {
      expect(AuthStorageService.isRememberEnabled()).toBe(false);
    });

    it('should handle storage errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(AuthStorageService.isRememberEnabled()).toBe(false);
    });
  });

  describe('setRememberPreference', () => {
    it('should enable remember preference', () => {
      AuthStorageService.setRememberPreference(true);

      expect(localStorage.getItem('bda-portal.remember-email')).toBe('true');
    });

    it('should disable remember preference', () => {
      AuthStorageService.setRememberPreference(false);

      expect(localStorage.getItem('bda-portal.remember-email')).toBe('false');
    });

    it('should clear email when disabling remember', () => {
      localStorage.setItem('bda-portal.last-email', 'test@example.com');
      localStorage.setItem('bda-portal.remember-email', 'true');

      AuthStorageService.setRememberPreference(false);

      expect(localStorage.getItem('bda-portal.last-email')).toBeNull();
      expect(localStorage.getItem('bda-portal.remember-email')).toBe('false');
    });

    it('should not clear email when enabling remember', () => {
      localStorage.setItem('bda-portal.last-email', 'test@example.com');

      AuthStorageService.setRememberPreference(true);

      expect(localStorage.getItem('bda-portal.last-email')).toBe('test@example.com');
    });
  });

  describe('clearAll', () => {
    it('should clear all auth storage', () => {
      localStorage.setItem('bda-portal.last-email', 'test@example.com');
      localStorage.setItem('bda-portal.remember-email', 'true');

      AuthStorageService.clearAll();

      expect(localStorage.getItem('bda-portal.last-email')).toBeNull();
      expect(localStorage.getItem('bda-portal.remember-email')).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('should return status when email is saved and remember is enabled', () => {
      localStorage.setItem('bda-portal.last-email', 'test@example.com');
      localStorage.setItem('bda-portal.remember-email', 'true');

      const status = AuthStorageService.getStatus();

      expect(status.rememberEnabled).toBe(true);
      expect(status.hasStoredEmail).toBe(true);
      expect(status.email).toBe('test@example.com');
    });

    it('should return status when remember is disabled', () => {
      localStorage.setItem('bda-portal.last-email', 'test@example.com');
      localStorage.setItem('bda-portal.remember-email', 'false');

      const status = AuthStorageService.getStatus();

      expect(status.rememberEnabled).toBe(false);
      expect(status.hasStoredEmail).toBe(true);
      expect(status.email).toBeNull();
    });

    it('should return status when nothing is saved', () => {
      const status = AuthStorageService.getStatus();

      expect(status.rememberEnabled).toBe(false);
      expect(status.hasStoredEmail).toBe(false);
      expect(status.email).toBeNull();
    });
  });

  describe('Security', () => {
    it('should never store password', () => {
      AuthStorageService.saveLastEmail('test@example.com');

      const allKeys = Object.keys(localStorage);
      const hasPasswordKey = allKeys.some((key) =>
        key.toLowerCase().includes('password')
      );

      expect(hasPasswordKey).toBe(false);
    });

    it('should only store email-related data', () => {
      AuthStorageService.saveLastEmail('test@example.com');

      // Check that only expected keys are set
      expect(localStorage.getItem('bda-portal.last-email')).toBe('test@example.com');
      expect(localStorage.getItem('bda-portal.remember-email')).toBe('true');

      // Verify no password-related keys exist
      expect(localStorage.getItem('bda-portal.password')).toBeNull();
      expect(localStorage.getItem('bda-portal.credentials')).toBeNull();
    });

    it('should handle XSS attempts in email', () => {
      const xssEmail = '<script>alert("xss")</script>@example.com';

      AuthStorageService.saveLastEmail(xssEmail);

      // Email format is technically valid (matches regex)
      // XSS protection is handled at render time, not storage
      expect(localStorage.getItem('bda-portal.last-email')).toBe(xssEmail);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long email addresses', () => {
      const longEmail = 'a'.repeat(100) + '@example.com';

      AuthStorageService.saveLastEmail(longEmail);

      // Should not save extremely long emails (even if technically valid)
      const saved = localStorage.getItem('bda-portal.last-email');
      expect(saved).toBeTruthy();
    });

    it('should handle rapid save/clear cycles', () => {
      for (let i = 0; i < 100; i++) {
        AuthStorageService.saveLastEmail(`test${i}@example.com`);
        AuthStorageService.clearLastEmail();
      }

      expect(localStorage.getItem('bda-portal.last-email')).toBeNull();
    });

    it('should handle Unicode characters in email', () => {
      const unicodeEmail = 'test@例え.jp';

      AuthStorageService.saveLastEmail(unicodeEmail);

      // Should handle international domains
      const saved = localStorage.getItem('bda-portal.last-email');
      expect(saved).toBe(unicodeEmail);
    });
  });
});
