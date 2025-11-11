import { AppError } from './errors';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  error?: Error;
  context?: Record<string, any>;
  userId?: string;
  action?: string;
}

class Logger {
  private isDevelopment = __DEV__;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: Record<string, any>,
    userId?: string,
    action?: string
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      error,
      context,
      userId,
      action,
    };
  }

  private addLog(logEntry: LogEntry): void {
    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // In development, also console log
    if (this.isDevelopment) {
      const logMessage = `[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`;
      
      switch (logEntry.level) {
        case LogLevel.ERROR:
          console.error(logMessage, logEntry.error || '', logEntry.context || '');
          break;
        case LogLevel.WARN:
          console.warn(logMessage, logEntry.context || '');
          break;
        case LogLevel.INFO:
          console.info(logMessage, logEntry.context || '');
          break;
        case LogLevel.DEBUG:
          console.log(logMessage, logEntry.context || '');
          break;
      }
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>, userId?: string, action?: string): void {
    const logEntry = this.createLogEntry(LogLevel.ERROR, message, error, context, userId, action);
    this.addLog(logEntry);
    
    // In production, you might want to send errors to a crash reporting service
    // Example: Crashlytics.recordError(error);
  }

  warn(message: string, context?: Record<string, any>, userId?: string, action?: string): void {
    const logEntry = this.createLogEntry(LogLevel.WARN, message, undefined, context, userId, action);
    this.addLog(logEntry);
  }

  info(message: string, context?: Record<string, any>, userId?: string, action?: string): void {
    const logEntry = this.createLogEntry(LogLevel.INFO, message, undefined, context, userId, action);
    this.addLog(logEntry);
  }

  debug(message: string, context?: Record<string, any>, userId?: string, action?: string): void {
    if (this.isDevelopment) {
      const logEntry = this.createLogEntry(LogLevel.DEBUG, message, undefined, context, userId, action);
      this.addLog(logEntry);
    }
  }

  // User action logging for analytics
  logUserAction(action: string, userId: string, details?: Record<string, any>): void {
    this.info(`User action: ${action}`, details, userId, action);
  }

  // API call logging
  logApiCall(endpoint: string, method: string, duration: number, userId?: string): void {
    this.info(`API call: ${method} ${endpoint}`, { duration }, userId, 'api_call');
  }

  // Error reporting for production
  logError(error: AppError | Error, context?: Record<string, any>, userId?: string): void {
    const message = error instanceof AppError 
      ? `${error.code}: ${error.message}` 
      : error.message;
    
    this.error(message, error, context, userId);
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(0, count);
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

// Utility function to safely handle async operations with logging
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  userId?: string
): Promise<{ data?: T; error?: AppError }> {
  try {
    logger.debug(`Starting operation: ${operationName}`, undefined, userId);
    const result = await operation();
    logger.debug(`Completed operation: ${operationName}`, undefined, userId);
    return { data: result };
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError(
      `Operation failed: ${operationName}`,
      'OPERATION_ERROR',
      500,
      false
    );
    
    logger.logError(appError, { operationName }, userId);
    return { error: appError };
  }
}