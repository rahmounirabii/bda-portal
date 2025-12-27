/**
 * Tests for HealthCheckService
 * Covers WordPress API health monitoring, periodic checks, and status caching
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HealthCheckService } from '../health-check.service';
import { WordPressAPIService } from '../wordpress-api.service';

// Mock WordPress API Service
vi.mock('../wordpress-api.service');

describe('HealthCheckService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    HealthCheckService.stopPeriodicChecks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    HealthCheckService.stopPeriodicChecks();
  });

  describe('checkWordPressHealth', () => {
    it('should return true when WordPress API is healthy', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      const isHealthy = await HealthCheckService.checkWordPressHealth();

      expect(isHealthy).toBe(true);
      expect(WordPressAPIService.verifyCredentials).toHaveBeenCalled();
    });

    it('should return false when WordPress API is down', async () => {
      (WordPressAPIService.verifyCredentials as any).mockRejectedValue(
        new Error('Connection failed')
      );

      const isHealthy = await HealthCheckService.checkWordPressHealth();

      expect(isHealthy).toBe(false);
    });

    it('should return false when response time exceeds threshold', async () => {
      // Mock slow response (> 5 seconds)
      (WordPressAPIService.verifyCredentials as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 6000);
          })
      );

      const healthPromise = HealthCheckService.checkWordPressHealth();

      // Fast-forward past timeout
      vi.advanceTimersByTime(11000);

      const isHealthy = await healthPromise;

      expect(isHealthy).toBe(false);
    });

    it('should timeout after 10 seconds', async () => {
      (WordPressAPIService.verifyCredentials as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const healthPromise = HealthCheckService.checkWordPressHealth();

      vi.advanceTimersByTime(11000);

      const isHealthy = await healthPromise;

      expect(isHealthy).toBe(false);
    });

    it('should update cached health status', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      await HealthCheckService.checkWordPressHealth();

      const status = HealthCheckService.getHealthStatus();

      expect(status).toBeDefined();
      expect(status?.wordpress.available).toBe(true);
      expect(status?.wordpress.lastCheck).toBeTruthy();
    });
  });

  describe('initializeHealthChecks', () => {
    it('should return initial health status', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      const status = await HealthCheckService.initializeHealthChecks();

      expect(status.status).toBe('healthy');
      expect(status.wordpress.available).toBe(true);
      expect(status.portal.available).toBe(true);
    });

    it('should schedule periodic checks', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      await HealthCheckService.initializeHealthChecks();

      const stats = HealthCheckService.getStats();

      expect(stats.isMonitoring).toBe(true);
    });

    it('should set degraded status when WordPress is down', async () => {
      (WordPressAPIService.verifyCredentials as any).mockRejectedValue(
        new Error('Connection failed')
      );

      const status = await HealthCheckService.initializeHealthChecks();

      expect(status.status).toBe('degraded');
      expect(status.wordpress.available).toBe(false);
      expect(status.portal.available).toBe(true);
    });
  });

  describe('Periodic Checks', () => {
    it('should run checks at 5-minute intervals', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      await HealthCheckService.initializeHealthChecks();

      // Clear initial call
      vi.clearAllMocks();

      // Fast-forward 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);

      // Should have triggered another check
      expect(WordPressAPIService.verifyCredentials).toHaveBeenCalled();
    });

    it('should not run checks if stopped', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      await HealthCheckService.initializeHealthChecks();
      HealthCheckService.stopPeriodicChecks();

      vi.clearAllMocks();

      // Fast-forward 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(WordPressAPIService.verifyCredentials).not.toHaveBeenCalled();
    });
  });

  describe('isWordPressHealthy', () => {
    it('should return false when no health check has run', () => {
      expect(HealthCheckService.isWordPressHealthy()).toBe(false);
    });

    it('should return cached health status', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      await HealthCheckService.checkWordPressHealth();

      expect(HealthCheckService.isWordPressHealthy()).toBe(true);
    });

    it('should reflect latest health check', async () => {
      (WordPressAPIService.verifyCredentials as any)
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Down'));

      await HealthCheckService.checkWordPressHealth();
      expect(HealthCheckService.isWordPressHealthy()).toBe(true);

      await HealthCheckService.checkWordPressHealth();
      expect(HealthCheckService.isWordPressHealthy()).toBe(false);
    });
  });

  describe('forceHealthCheck', () => {
    it('should bypass cache and run fresh check', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      const status = await HealthCheckService.forceHealthCheck();

      expect(status.status).toBe('healthy');
      expect(WordPressAPIService.verifyCredentials).toHaveBeenCalled();
    });

    it('should update cached status', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      await HealthCheckService.forceHealthCheck();

      const cachedStatus = HealthCheckService.getHealthStatus();

      expect(cachedStatus?.status).toBe('healthy');
    });
  });

  describe('getHealthStatus', () => {
    it('should return null when no checks have run', () => {
      const status = HealthCheckService.getHealthStatus();

      expect(status).toBeNull();
    });

    it('should return cached status', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      await HealthCheckService.checkWordPressHealth();

      const status = HealthCheckService.getHealthStatus();

      expect(status).toBeDefined();
      expect(status?.wordpress.available).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return stats when no checks have run', () => {
      const stats = HealthCheckService.getStats();

      expect(stats.lastCheckTime).toBe('Never');
      expect(stats.isMonitoring).toBe(false);
      expect(stats.currentStatus).toBeNull();
    });

    it('should return stats after health check', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      await HealthCheckService.initializeHealthChecks();

      const stats = HealthCheckService.getStats();

      expect(stats.lastCheckTime).not.toBe('Never');
      expect(stats.isMonitoring).toBe(true);
      expect(stats.currentStatus).toBe('healthy');
    });

    it('should calculate time since last check', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      await HealthCheckService.checkWordPressHealth();

      // Fast-forward 2 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);

      const stats = HealthCheckService.getStats();

      expect(stats.timeSinceLastCheck).toContain('2m');
    });
  });

  describe('Status Calculation', () => {
    it('should be healthy when both Portal and WordPress are up', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      const status = await HealthCheckService.initializeHealthChecks();

      expect(status.status).toBe('healthy');
    });

    it('should be degraded when WordPress is down but Portal is up', async () => {
      (WordPressAPIService.verifyCredentials as any).mockRejectedValue(
        new Error('Connection failed')
      );

      const status = await HealthCheckService.initializeHealthChecks();

      expect(status.status).toBe('degraded');
      expect(status.portal.available).toBe(true);
      expect(status.wordpress.available).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (WordPressAPIService.verifyCredentials as any).mockRejectedValue(
        new Error('Network error')
      );

      const isHealthy = await HealthCheckService.checkWordPressHealth();

      expect(isHealthy).toBe(false);

      const status = HealthCheckService.getHealthStatus();
      expect(status?.wordpress.error).toContain('Network error');
    });

    it('should handle timeout errors', async () => {
      (WordPressAPIService.verifyCredentials as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const healthPromise = HealthCheckService.checkWordPressHealth();

      vi.advanceTimersByTime(11000);

      await healthPromise;

      const status = HealthCheckService.getHealthStatus();
      expect(status?.wordpress.available).toBe(false);
    });

    it('should not crash on multiple concurrent checks', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      const promises = [
        HealthCheckService.checkWordPressHealth(),
        HealthCheckService.checkWordPressHealth(),
        HealthCheckService.checkWordPressHealth(),
      ];

      const results = await Promise.all(promises);

      expect(results.every((r) => r === true)).toBe(true);
    });
  });

  describe('Response Time Tracking', () => {
    it('should track response time for successful checks', async () => {
      (WordPressAPIService.verifyCredentials as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 1000);
          })
      );

      const healthPromise = HealthCheckService.checkWordPressHealth();

      vi.advanceTimersByTime(1000);

      await healthPromise;

      const status = HealthCheckService.getHealthStatus();

      expect(status?.wordpress.responseTime).toBeGreaterThanOrEqual(1000);
      expect(status?.wordpress.responseTime).toBeLessThan(2000);
    });

    it('should consider < 5s as healthy response time', async () => {
      (WordPressAPIService.verifyCredentials as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 3000);
          })
      );

      const healthPromise = HealthCheckService.checkWordPressHealth();

      vi.advanceTimersByTime(3000);

      const isHealthy = await healthPromise;

      expect(isHealthy).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid start/stop cycles', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue({
        success: true,
      });

      for (let i = 0; i < 10; i++) {
        await HealthCheckService.initializeHealthChecks();
        HealthCheckService.stopPeriodicChecks();
      }

      const stats = HealthCheckService.getStats();
      expect(stats.isMonitoring).toBe(false);
    });

    it('should handle missing WordPress response data', async () => {
      (WordPressAPIService.verifyCredentials as any).mockResolvedValue(null);

      const isHealthy = await HealthCheckService.checkWordPressHealth();

      expect(isHealthy).toBe(true); // Should handle gracefully
    });
  });
});
