/// <reference types="jest" />

import {
  AppError,
  ValidationError,
  NetworkError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('Test message', 'TEST_CODE', 400, true);
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('Error');
    });

    it('should use default values when not provided', () => {
      const error = new AppError('Test message', 'TEST_CODE');
      
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test message', 'TEST_CODE');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Test message');
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid input', 'email');
      
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should work without field parameter', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('NetworkError', () => {
    it('should create a NetworkError with default message', () => {
      const error = new NetworkError();
      
      expect(error.message).toBe('Network request failed');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(0);
      expect(error.name).toBe('NetworkError');
    });

    it('should create a NetworkError with custom message', () => {
      const error = new NetworkError('Custom network error');
      
      expect(error.message).toBe('Custom network error');
    });
  });

  describe('AuthenticationError', () => {
    it('should create an AuthenticationError with default message', () => {
      const error = new AuthenticationError();
      
      expect(error.message).toBe('Authentication failed');
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
    });

    it('should create an AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Invalid credentials');
      
      expect(error.message).toBe('Invalid credentials');
    });
  });

  describe('PermissionError', () => {
    it('should create a PermissionError with default message', () => {
      const error = new PermissionError();
      
      expect(error.message).toBe('Permission denied');
      expect(error.code).toBe('PERMISSION_ERROR');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('PermissionError');
    });

    it('should create a PermissionError with custom message', () => {
      const error = new PermissionError('Access forbidden');
      
      expect(error.message).toBe('Access forbidden');
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with default resource', () => {
      const error = new NotFoundError();
      
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('NOT_FOUND_ERROR');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should create a NotFoundError with custom resource', () => {
      const error = new NotFoundError('User');
      
      expect(error.message).toBe('User not found');
    });
  });

  describe('ConflictError', () => {
    it('should create a ConflictError with custom message', () => {
      const error = new ConflictError('Resource already exists');
      
      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe('CONFLICT_ERROR');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('RateLimitError', () => {
    it('should create a RateLimitError with default message', () => {
      const error = new RateLimitError();
      
      expect(error.message).toBe('Too many requests');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('RateLimitError');
    });

    it('should create a RateLimitError with custom message', () => {
      const error = new RateLimitError('Rate limit exceeded');
      
      expect(error.message).toBe('Rate limit exceeded');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create a ServiceUnavailableError with default service', () => {
      const error = new ServiceUnavailableError();
      
      expect(error.message).toBe('Service is currently unavailable');
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
      expect(error.statusCode).toBe(503);
      expect(error.name).toBe('ServiceUnavailableError');
    });

    it('should create a ServiceUnavailableError with custom service', () => {
      const error = new ServiceUnavailableError('Database');
      
      expect(error.message).toBe('Database is currently unavailable');
    });
  });

  describe('Error Inheritance', () => {
    it('should properly extend Error class', () => {
      const appError = new AppError('Test', 'TEST');
      const validationError = new ValidationError('Test');
      
      expect(appError instanceof Error).toBe(true);
      expect(appError instanceof AppError).toBe(true);
      expect(validationError instanceof Error).toBe(true);
      expect(validationError instanceof AppError).toBe(true);
      expect(validationError instanceof ValidationError).toBe(true);
    });
  });
});