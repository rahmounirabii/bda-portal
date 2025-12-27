/**
 * Logger Service
 * Structured logging with levels, context, and environment awareness
 * Provides consistent logging across the application with emoji prefixes for visibility
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  errorId?: string;
  error?: any;
}

/**
 * Structured Logger Service
 *
 * Usage:
 * ```ts
 * Logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 * Logger.warn('Session expiring soon', { minutesRemaining: 5 });
 * Logger.error('Login failed', new Error('Invalid credentials'), { email: 'user@example.com' });
 * ```
 */
export class Logger {
  private static isDevelopment = import.meta.env.DEV;
  private static logs: LogEntry[] = [];
  private static maxLogs = 100; // Keep last 100 logs in memory

  /**
   * Safe JSON stringify that handles circular references
   */
  private static safeStringify(obj: any): string {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    }, 2);
  }

  /**
   * Log informational message
   */
  static info(message: string, context?: LogContext): void {
    this.log('info', '🔐', message, context);
  }

  /**
   * Log warning message
   */
  static warn(message: string, context?: LogContext): void {
    this.log('warn', '⚠️', message, context);
  }

  /**
   * Log error message
   */
  static error(message: string, error?: any, context?: LogContext): void {
    const errorId = this.generateErrorId();
    this.log('error', '❌', message, { ...context, errorId }, error);
  }

  /**
   * Log debug message (only in development)
   */
  static debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', '🐛', message, context);
    }
  }

  /**
   * Log success message
   */
  static success(message: string, context?: LogContext): void {
    this.log('info', '✅', message, context);
  }

  /**
   * Core logging function
   */
  private static log(
    level: LogLevel,
    emoji: string,
    message: string,
    context?: LogContext,
    error?: any
  ): void {
    const timestamp = new Date().toISOString();

    const logEntry: LogEntry = {
      level,
      message,
      context,
      timestamp,
      error: error
        ? {
            message: error.message,
            name: error.name,
            stack: error.stack,
          }
        : undefined,
    };

    // Store in memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Format log message
    const prefix = `${emoji} [${this.formatLevel(level)}]`;
    const contextStr = context ? `\n   Context: ${this.safeStringify(context)}` : '';
    const errorStr = error ? `\n   Error: ${error.message}\n   Stack: ${error.stack}` : '';

    // Log to console based on level
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}${contextStr}${errorStr}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}${contextStr}`);
        break;
      case 'debug':
        console.debug(`${prefix} ${message}${contextStr}`);
        break;
      case 'info':
      default:
        console.log(`${prefix} ${message}${contextStr}`);
        break;
    }

    // Send to monitoring service in production
    if (!this.isDevelopment && (level === 'error' || level === 'warn')) {
      this.sendToMonitoring(logEntry);
    }
  }

  /**
   * Format log level for display
   */
  private static formatLevel(level: LogLevel): string {
    return level.toUpperCase().padEnd(5);
  }

  /**
   * Generate unique error ID for tracking
   */
  private static generateErrorId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `ERR-${timestamp}-${random}`;
  }

  /**
   * Send log to monitoring service (Sentry, LogRocket, etc.)
   */
  private static sendToMonitoring(logEntry: LogEntry): void {
    // TODO: Integrate with monitoring service
    // Example: Sentry.captureMessage(logEntry.message, { level: logEntry.level, extra: logEntry.context });

    // For now, just log that we would send it
    if (this.isDevelopment) {
      console.log('📊 [Logger] Would send to monitoring:', logEntry);
    }
  }

  /**
   * Get recent logs (for debugging)
   */
  static getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  static getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Clear all stored logs
   */
  static clearLogs(): void {
    this.logs = [];
    console.log('🧹 [Logger] Logs cleared');
  }

  /**
   * Export logs as JSON (for support/debugging)
   */
  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get log statistics
   */
  static getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    oldestLog: string | null;
    newestLog: string | null;
  } {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    };

    this.logs.forEach((log) => {
      byLevel[log.level]++;
    });

    return {
      total: this.logs.length,
      byLevel,
      oldestLog: this.logs[0]?.timestamp || null,
      newestLog: this.logs[this.logs.length - 1]?.timestamp || null,
    };
  }

  /**
   * Log authentication event (convenience method)
   */
  static authEvent(
    event: 'login' | 'logout' | 'signup' | 'session_expired' | 'token_refreshed',
    userId?: string,
    context?: LogContext
  ): void {
    this.info(`Auth event: ${event}`, {
      event,
      userId,
      ...context,
    });
  }

  /**
   * Log API request (convenience method)
   */
  static apiRequest(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    context?: LogContext
  ): void {
    const emoji = status >= 200 && status < 300 ? '✅' : '❌';
    const level: LogLevel = status >= 400 ? 'error' : 'info';

    this.log(
      level,
      emoji,
      `${method} ${endpoint} - ${status} (${duration}ms)`,
      {
        method,
        endpoint,
        status,
        duration,
        ...context,
      }
    );
  }

  /**
   * Log performance metric (convenience method)
   */
  static performance(metric: string, value: number, unit: string = 'ms', context?: LogContext): void {
    const emoji = value < 1000 ? '⚡' : value < 3000 ? '⏱️' : '🐌';
    this.log('info', emoji, `Performance: ${metric} = ${value}${unit}`, {
      metric,
      value,
      unit,
      ...context,
    });
  }
}

/**
 * Create a scoped logger for a specific module
 *
 * Usage:
 * ```ts
 * const logger = createScopedLogger('AuthService');
 * logger.info('User logged in'); // Will log: "🔐 [INFO] [AuthService] User logged in"
 * ```
 */
export function createScopedLogger(scope: string) {
  return {
    info: (message: string, context?: LogContext) =>
      Logger.info(`[${scope}] ${message}`, context),
    warn: (message: string, context?: LogContext) =>
      Logger.warn(`[${scope}] ${message}`, context),
    error: (message: string, error?: any, context?: LogContext) =>
      Logger.error(`[${scope}] ${message}`, error, context),
    debug: (message: string, context?: LogContext) =>
      Logger.debug(`[${scope}] ${message}`, context),
    success: (message: string, context?: LogContext) =>
      Logger.success(`[${scope}] ${message}`, context),
  };
}
