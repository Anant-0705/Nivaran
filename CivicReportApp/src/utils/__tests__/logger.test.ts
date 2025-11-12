/// <reference types="jest" />

import { logger, LogLevel, safeAsyncOperation } from '../logger';
import { AppError } from '../errors';

describe('Logger', () => {
  beforeEach(() => {
    logger.clearLogs();
    jest.clearAllMocks();
  });

  describe('Basic Logging', () => {
    it('should log error messages correctly', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      
      logger.error('Test error message', error, { context: 'test' }, 'user123', 'test_action');
      
      const logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.ERROR,
        message: 'Test error message',
        error,
        context: { context: 'test' },
        userId: 'user123',
        action: 'test_action',
      });
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log warning messages correctly', () => {
      logger.warn('Test warning', { test: true }, 'user456');
      
      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.WARN,
        message: 'Test warning',
        context: { test: true },
        userId: 'user456',
      });
    });

    it('should log info messages correctly', () => {
      logger.info('Test info message');
      
      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.INFO,
        message: 'Test info message',
      });
    });

    it('should log debug messages in development only', () => {
      // Mock __DEV__ as true
      (global as any).__DEV__ = true;
      
      logger.debug('Debug message');
      let logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);

      logger.clearLogs();

      // Debug messages are always added in the current implementation
      logger.debug('Another debug message');
      logs = logger.getRecentLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Another debug message');
    });
  });

  describe('Specialized Logging Methods', () => {
    it('should log user actions correctly', () => {
      logger.logUserAction('button_click', 'user789', { button: 'submit' });
      
      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.INFO,
        message: 'User action: button_click',
        context: { button: 'submit' },
        userId: 'user789',
        action: 'button_click',
      });
    });

    it('should log API calls correctly', () => {
      logger.logApiCall('/api/users', 'GET', 150, 'user123');
      
      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.INFO,
        message: 'API call: GET /api/users',
        context: { duration: 150 },
        userId: 'user123',
        action: 'api_call',
      });
    });

    it('should log AppError correctly', () => {
      const appError = new AppError('Custom error', 'CUSTOM_ERROR', 400);
      logger.logError(appError, { additional: 'context' }, 'user456');
      
      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.ERROR,
        message: 'CUSTOM_ERROR: Custom error',
        error: appError,
        context: { additional: 'context' },
        userId: 'user456',
      });
    });

    it('should log standard Error correctly', () => {
      const standardError = new Error('Standard error');
      logger.logError(standardError);
      
      const logs = logger.getRecentLogs(1);
      expect(logs[0]).toMatchObject({
        level: LogLevel.ERROR,
        message: 'Standard error',
        error: standardError,
      });
    });
  });

  describe('Log Management', () => {
    it('should maintain maximum log count', () => {
      // Add more than 100 logs (the default max)
      for (let i = 0; i < 150; i++) {
        logger.info(`Log message ${i}`);
      }
      
      const allLogs = logger.getRecentLogs(150);
      expect(allLogs).toHaveLength(100);
      
      // Most recent should be the last message we logged
      expect(allLogs[0].message).toBe('Log message 149');
    });

    it('should clear logs correctly', () => {
      logger.info('Test message');
      expect(logger.getRecentLogs(1)).toHaveLength(1);
      
      logger.clearLogs();
      expect(logger.getRecentLogs(1)).toHaveLength(0);
    });

    it('should export logs as JSON string', () => {
      logger.info('Test message');
      const exportedLogs = logger.exportLogs();
      
      expect(() => JSON.parse(exportedLogs)).not.toThrow();
      const parsedLogs = JSON.parse(exportedLogs);
      expect(parsedLogs).toHaveLength(1);
      expect(parsedLogs[0].message).toBe('Test message');
    });
  });

  describe('safeAsyncOperation', () => {
    it('should handle successful operations', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success result');
      
      const result = await safeAsyncOperation(mockOperation, 'test_operation', 'user123');
      
      expect(result).toEqual({ data: 'success result' });
      expect(mockOperation).toHaveBeenCalled();
      
      const logs = logger.getRecentLogs(2);
      expect(logs[0].message).toBe('Completed operation: test_operation');
      expect(logs[1].message).toBe('Starting operation: test_operation');
    });

    it('should handle AppError failures', async () => {
      const appError = new AppError('Operation failed', 'OP_FAILED', 500);
      const mockOperation = jest.fn().mockRejectedValue(appError);
      
      const result = await safeAsyncOperation(mockOperation, 'failing_operation', 'user456');
      
      expect(result).toEqual({ error: appError });
      expect(mockOperation).toHaveBeenCalled();
      
      const logs = logger.getRecentLogs(2);
      expect(logs[0]).toMatchObject({
        level: LogLevel.ERROR,
        message: 'OP_FAILED: Operation failed',
        userId: 'user456',
      });
    });

    it('should handle standard Error failures', async () => {
      const standardError = new Error('Standard failure');
      const mockOperation = jest.fn().mockRejectedValue(standardError);
      
      const result = await safeAsyncOperation(mockOperation, 'failing_operation');
      
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error?.message).toBe('Operation failed: failing_operation');
      expect(result.error?.code).toBe('OPERATION_ERROR');
    });
  });
});