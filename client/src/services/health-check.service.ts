/**
 * Health Check Service
 * Monitors WordPress API connectivity and system health
 * Non-blocking checks for graceful degradation
 */

import { WordPressAPIService } from './wordpress-api.service';
import { API_CONFIG } from '../config/api.config';

export type HealthStatus = 'healthy' | 'degraded' | 'down';

export interface HealthCheckResult {
  status: HealthStatus;
  wordpress: {
    available: boolean;
    responseTime?: number;
    lastCheck: string;
    version?: string;
    error?: string;
  };
  portal: {
    available: boolean;
    responseTime?: number;
  };
}

/**
 * Service for monitoring system health
 * Runs non-blocking checks on WordPress API
 */
export class HealthCheckService {
  private static healthStatus: HealthCheckResult | null = null;
  private static lastCheckTime = 0;
  private static checkIntervalId: NodeJS.Timeout | null = null;

  // Configuration
  private static readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly HEALTHY_RESPONSE_TIME = 5000; // 5 seconds
  private static readonly CHECK_TIMEOUT = 10000; // 10 seconds

  /**
   * Check WordPress API health
   * Non-blocking, returns cached result if recent check exists
   *
   * @returns true if WordPress is healthy
   */
  static async checkWordPressHealth(): Promise<boolean> {
    try {
      console.log('🏥 [HealthCheck] Checking WordPress API health...');
      const startTime = Date.now();

      // Use the /test endpoint which doesn't require authentication
      const result = await Promise.race([
        WordPressAPIService.testConnection(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), this.CHECK_TIMEOUT)
        )
      ]) as any;

      const responseTime = Date.now() - startTime;

      // Health check is successful if API responds with success and in reasonable time
      const isHealthy = result?.success === true && responseTime < this.HEALTHY_RESPONSE_TIME;

      this.updateHealthStatus({
        wordpress: {
          available: isHealthy,
          responseTime,
          lastCheck: new Date().toISOString(),
          error: isHealthy ? undefined : 'Response time too slow',
        },
      });

      if (!isHealthy) {
        console.warn('⚠️ [HealthCheck] WordPress API is slow or degraded:', responseTime, 'ms');
      } else {
        console.log('✅ [HealthCheck] WordPress API is healthy:', responseTime, 'ms');
      }

      return isHealthy;
    } catch (error: any) {
      console.error('❌ [HealthCheck] WordPress health check failed:', error.message);

      this.updateHealthStatus({
        wordpress: {
          available: false,
          lastCheck: new Date().toISOString(),
          error: error.message || 'Connection failed',
        },
      });

      return false;
    }
  }

  /**
   * Initialize health checks on app start
   * Sets up periodic monitoring
   * Skips WordPress checks if store sync is disabled
   *
   * @returns Initial health status
   */
  static async initializeHealthChecks(): Promise<HealthCheckResult> {
    console.log('🏥 [HealthCheck] Initializing system health checks...');

    // Skip WordPress checks if store sync is disabled
    if (!API_CONFIG.features.enableStoreSync) {
      console.log('ℹ️ [HealthCheck] Store sync disabled, skipping WordPress health checks');

      const status: HealthCheckResult = {
        status: 'healthy',
        wordpress: {
          available: false,
          lastCheck: new Date().toISOString(),
          error: 'Store sync disabled',
        },
        portal: {
          available: true,
          responseTime: 0,
        },
      };

      this.healthStatus = status;
      this.lastCheckTime = Date.now();

      console.log('✅ [HealthCheck] Health checks initialized (WordPress skipped). Status:', status.status);
      return status;
    }

    // Check WordPress (non-blocking)
    const wpHealthy = await this.checkWordPressHealth();

    const status: HealthCheckResult = {
      status: wpHealthy ? 'healthy' : 'degraded',
      wordpress: {
        available: wpHealthy,
        lastCheck: new Date().toISOString(),
      },
      portal: {
        available: true, // Portal is always available (local)
        responseTime: 0,
      },
    };

    this.healthStatus = status;
    this.lastCheckTime = Date.now();

    // Schedule periodic checks only if store sync is enabled
    this.schedulePeriodicChecks();

    console.log('✅ [HealthCheck] Health checks initialized. Status:', status.status);

    return status;
  }

  /**
   * Schedule background health checks
   * Runs every 5 minutes
   * Skipped if store sync is disabled
   */
  private static schedulePeriodicChecks(): void {
    // Skip if store sync is disabled
    if (!API_CONFIG.features.enableStoreSync) {
      console.log('ℹ️ [HealthCheck] Store sync disabled, skipping periodic checks');
      return;
    }

    // Clear existing interval if any
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
    }

    console.log('⏰ [HealthCheck] Scheduling periodic checks every', this.CHECK_INTERVAL / 1000, 'seconds');

    this.checkIntervalId = setInterval(async () => {
      const now = Date.now();
      if (now - this.lastCheckTime >= this.CHECK_INTERVAL) {
        console.log('🔄 [HealthCheck] Running periodic health check...');
        await this.checkWordPressHealth();
        this.lastCheckTime = now;
      }
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop periodic health checks
   * Call this on app cleanup
   */
  static stopPeriodicChecks(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
      console.log('🛑 [HealthCheck] Stopped periodic health checks');
    }
  }

  /**
   * Get current cached health status
   * Does not trigger a new check
   *
   * @returns Cached health status or null
   */
  static getHealthStatus(): HealthCheckResult | null {
    return this.healthStatus;
  }

  /**
   * Check if WordPress is currently available
   * Uses cached status
   *
   * @returns true if WordPress is healthy
   */
  static isWordPressHealthy(): boolean {
    return this.healthStatus?.wordpress.available ?? false;
  }

  /**
   * Force a fresh health check
   * Ignores cache
   *
   * @returns Fresh health check result
   */
  static async forceHealthCheck(): Promise<HealthCheckResult> {
    console.log('🔄 [HealthCheck] Forcing fresh health check...');

    const wpHealthy = await this.checkWordPressHealth();

    const status: HealthCheckResult = {
      status: wpHealthy ? 'healthy' : 'degraded',
      wordpress: {
        available: wpHealthy,
        lastCheck: new Date().toISOString(),
      },
      portal: {
        available: true,
        responseTime: 0,
      },
    };

    this.healthStatus = status;
    this.lastCheckTime = Date.now();

    return status;
  }

  /**
   * Update health status
   */
  private static updateHealthStatus(updates: Partial<HealthCheckResult>): void {
    if (!this.healthStatus) {
      this.healthStatus = {
        status: 'healthy',
        wordpress: {
          available: true,
          lastCheck: new Date().toISOString(),
        },
        portal: {
          available: true,
          responseTime: 0,
        },
      };
    }

    this.healthStatus = {
      ...this.healthStatus,
      ...updates,
      status: this.calculateOverallStatus(updates),
    };
  }

  /**
   * Calculate overall system status
   */
  private static calculateOverallStatus(updates: Partial<HealthCheckResult>): HealthStatus {
    const wpAvailable = updates.wordpress?.available ?? this.healthStatus?.wordpress.available ?? false;
    const portalAvailable = updates.portal?.available ?? this.healthStatus?.portal.available ?? true;

    if (wpAvailable && portalAvailable) {
      return 'healthy';
    }
    if (portalAvailable) {
      return 'degraded'; // Portal works, WordPress down
    }
    return 'down';
  }

  /**
   * Get time since last check
   *
   * @returns Time in milliseconds
   */
  static getTimeSinceLastCheck(): number {
    return Date.now() - this.lastCheckTime;
  }

  /**
   * Get health check statistics for debugging
   */
  static getStats(): {
    lastCheckTime: string;
    timeSinceLastCheck: string;
    isMonitoring: boolean;
    currentStatus: HealthStatus | null;
  } {
    const timeSince = this.getTimeSinceLastCheck();
    const minutes = Math.floor(timeSince / 60000);
    const seconds = Math.floor((timeSince % 60000) / 1000);

    return {
      lastCheckTime: this.lastCheckTime
        ? new Date(this.lastCheckTime).toISOString()
        : 'Never',
      timeSinceLastCheck: `${minutes}m ${seconds}s ago`,
      isMonitoring: this.checkIntervalId !== null,
      currentStatus: this.healthStatus?.status || null,
    };
  }
}
