/**
 * Tests for Logger Service
 * Covers logging levels, context, error tracking, and scoped loggers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger, createScopedLogger } from '../logger.service';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Logger.clearLogs();

    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Logger.clearLogs();
  });

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      Logger.info('Test info message');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      );
    });

    it('should log warning messages', () => {
      Logger.warn('Test warning');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN')
      );
    });

    it('should log error messages', () => {
      Logger.error('Test error');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR')
      );
    });

    it('should log success messages', () => {
      Logger.success('Test success');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅')
      );
    });
  });

  describe('Context Logging', () => {
    it('should log with context object', () => {
      Logger.info('User action', { userId: '123', action: 'login' });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('userId')
      );
    });

    it('should format context as JSON', () => {
      const context = { key: 'value', nested: { data: 'test' } };

      Logger.info('Test', context);

      const callArgs = (console.log as any).mock.calls[0][0];
      expect(callArgs).toContain('"key": "value"');
    });

    it('should handle empty context', () => {
      Logger.info('Test message', {});

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle undefined context', () => {
      Logger.info('Test message');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
    });
  });

  describe('Error Logging', () => {
    it('should log error with Error object', () => {
      const error = new Error('Test error');

      Logger.error('Operation failed', error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });

    it('should include error stack trace', () => {
      const error = new Error('Test error');

      Logger.error('Operation failed', error);

      const callArgs = (console.error as any).mock.calls[0][0];
      expect(callArgs).toContain('Stack:');
    });

    it('should generate error ID', () => {
      Logger.error('Operation failed', new Error('Test'));

      const logs = Logger.getRecentLogs();
      expect(logs[0].context?.errorId).toMatch(/ERR-\d+-[a-z0-9]+/);
    });

    it('should handle error without Error object', () => {
      Logger.error('Generic error message');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Log Storage', () => {
    it('should store logs in memory', () => {
      Logger.info('Test 1');
      Logger.warn('Test 2');
      Logger.error('Test 3');

      const logs = Logger.getRecentLogs();

      expect(logs).toHaveLength(3);
    });

    it('should limit stored logs to 100', () => {
      for (let i = 0; i < 150; i++) {
        Logger.info(`Message ${i}`);
      }

      const logs = Logger.getRecentLogs();

      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it('should return limited recent logs', () => {
      for (let i = 0; i < 50; i++) {
        Logger.info(`Message ${i}`);
      }

      const logs = Logger.getRecentLogs(10);

      expect(logs).toHaveLength(10);
    });
  });

  describe('Log Filtering', () => {
    it('should filter logs by level', () => {
      Logger.info('Info message');
      Logger.warn('Warning message');
      Logger.error('Error message');

      const errorLogs = Logger.getLogsByLevel('error');

      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Error message');
    });

    it('should return empty array for non-existent level', () => {
      Logger.info('Test');

      const errorLogs = Logger.getLogsByLevel('error');

      expect(errorLogs).toHaveLength(0);
    });
  });

  describe('Log Statistics', () => {
    it('should return log statistics', () => {
      Logger.info('Info 1');
      Logger.info('Info 2');
      Logger.warn('Warning');
      Logger.error('Error');

      const stats = Logger.getStats();

      expect(stats.total).toBe(4);
      expect(stats.byLevel.info).toBe(2);
      expect(stats.byLevel.warn).toBe(1);
      expect(stats.byLevel.error).toBe(1);
      expect(stats.oldestLog).toBeTruthy();
      expect(stats.newestLog).toBeTruthy();
    });

    it('should handle empty logs', () => {
      const stats = Logger.getStats();

      expect(stats.total).toBe(0);
      expect(stats.oldestLog).toBeNull();
      expect(stats.newestLog).toBeNull();
    });
  });

  describe('Log Export', () => {
    it('should export logs as JSON', () => {
      Logger.info('Test message');

      const exported = Logger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].message).toBe('Test message');
    });

    it('should export empty array when no logs', () => {
      const exported = Logger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(parsed).toEqual([]);
    });
  });

  describe('Convenience Methods', () => {
    it('should log auth events', () => {
      Logger.authEvent('login', 'user-123', { method: 'email' });

      const logs = Logger.getRecentLogs();

      expect(logs[0].message).toContain('login');
      expect(logs[0].context?.userId).toBe('user-123');
      expect(logs[0].context?.method).toBe('email');
    });

    it('should log API requests', () => {
      Logger.apiRequest('POST', '/api/auth/login', 200, 150);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('POST')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('200')
      );
    });

    it('should log failed API requests as errors', () => {
      Logger.apiRequest('POST', '/api/auth/login', 401, 150);

      expect(console.error).toHaveBeenCalled();
    });

    it('should log performance metrics', () => {
      Logger.performance('page-load', 1500, 'ms');

      const logs = Logger.getRecentLogs();

      expect(logs[0].context?.metric).toBe('page-load');
      expect(logs[0].context?.value).toBe(1500);
    });

    it('should use different emojis for performance metrics', () => {
      Logger.performance('fast', 500);
      Logger.performance('medium', 2000);
      Logger.performance('slow', 5000);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('⚡'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('⏱️'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('🐌'));
    });
  });

  describe('Scoped Logger', () => {
    it('should create scoped logger with prefix', () => {
      const logger = createScopedLogger('AuthService');

      logger.info('User logged in');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[AuthService]')
      );
    });

    it('should support all log levels', () => {
      const logger = createScopedLogger('TestScope');

      logger.info('Info');
      logger.warn('Warning');
      logger.error('Error');
      logger.success('Success');

      expect(console.log).toHaveBeenCalledTimes(2); // info + success
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('should pass context to scoped logger', () => {
      const logger = createScopedLogger('TestScope');

      logger.info('Test', { key: 'value' });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('key')
      );
    });
  });

  describe('Clear Logs', () => {
    it('should clear all stored logs', () => {
      Logger.info('Test 1');
      Logger.info('Test 2');

      Logger.clearLogs();

      const logs = Logger.getRecentLogs();

      expect(logs).toHaveLength(0);
    });
  });

  describe('Emoji Prefixes', () => {
    it('should use correct emojis for each level', () => {
      Logger.info('Info');
      Logger.warn('Warning');
      Logger.error('Error');
      Logger.success('Success');

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('🔐'));
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('❌'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('✅'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(10000);

      Logger.info(longMessage);

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle special characters in messages', () => {
      Logger.info('Test with émojis 🎉 and special chars: <>&"\'');

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle circular references in context', () => {
      const circular: any = { key: 'value' };
      circular.self = circular;

      // Should not throw
      expect(() => {
        Logger.info('Test', circular);
      }).not.toThrow();
    });

    it('should handle null and undefined in context', () => {
      Logger.info('Test', { nullValue: null, undefinedValue: undefined });

      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('Timestamp', () => {
    it('should include timestamp in log entries', () => {
      Logger.info('Test');

      const logs = Logger.getRecentLogs();

      expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should have increasing timestamps', () => {
      Logger.info('First');
      Logger.info('Second');

      const logs = Logger.getRecentLogs();

      expect(new Date(logs[1].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(logs[0].timestamp).getTime()
      );
    });
  });
});
