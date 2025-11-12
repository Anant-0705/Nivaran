const request = require('supertest');
const express = require('express');

// Mock the health routes
const healthRoutes = require('../routes/health');

const app = express();
app.use(express.json());
app.use('/', healthRoutes);

// Mock global fetch for AI service calls
global.fetch = jest.fn();

// Mock supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
    })),
  },
}));

describe('Health Check Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    it('should include uptime in response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health with all services healthy', async () => {
      // Mock successful database connection
      const { supabase } = require('../config/supabase');
      supabase.from().select().limit.mockResolvedValue({ data: [{ id: 1 }], error: null });

      // Mock successful AI service connection
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toMatchObject({
        service: 'healthy',
        database: 'healthy',
        ai_service: 'healthy',
      });

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    it('should handle database connection errors', async () => {
      // Mock database connection failure
      const { supabase } = require('../config/supabase');
      supabase.from().select().limit.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      // Mock successful AI service
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const response = await request(app)
        .get('/health/detailed')
        .expect(503);

      expect(response.body).toMatchObject({
        service: 'unhealthy',
        database: 'unhealthy',
        ai_service: 'healthy',
        dependencies: {
          database: 'disconnected',
          ai_service: 'connected',
        },
      });
    });

    it('should handle AI service connection errors', async () => {
      // Mock successful database connection
      const { supabase } = require('../config/supabase');
      supabase.from().select().limit.mockResolvedValue({ data: [{ id: 1 }], error: null });

      // Mock AI service failure
      global.fetch.mockRejectedValue(new Error('AI Service Error'));

      const response = await request(app)
        .get('/health/detailed')
        .expect(503);

      expect(response.body).toMatchObject({
        service: 'unhealthy',
        database: 'healthy',
        ai_service: 'unhealthy',
        dependencies: {
          database: 'connected',
          ai_service: 'disconnected',
        },
      });

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            service: 'ai_service',
            message: expect.stringContaining('AI Service Error'),
          }),
        ])
      );
    });

    it('should handle both database and AI service failures', async () => {
      // Mock database failure
      const { supabase } = require('../config/supabase');
      supabase.from().select().limit.mockResolvedValue({
        data: null,
        error: { message: 'DB Connection failed' },
      });

      // Mock AI service failure
      global.fetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const response = await request(app)
        .get('/health/detailed')
        .expect(503);

      expect(response.body).toMatchObject({
        service: 'unhealthy',
        database: 'unhealthy',
        ai_service: 'unhealthy',
        dependencies: {
          database: 'disconnected',
          ai_service: 'disconnected',
        },
      });

      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toHaveLength(2);
    });
  });

  describe('Health endpoint error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Mock an unexpected error
      const { supabase } = require('../config/supabase');
      supabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const response = await request(app)
        .get('/health/detailed')
        .expect(500);

      expect(response.body).toHaveProperty('service', 'error');
      expect(response.body).toHaveProperty('message');
    });

    it('should handle timeout scenarios', async () => {
      // Mock long-running database query
      const { supabase } = require('../config/supabase');
      supabase.from().select().limit.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => resolve({ data: [{ id: 1 }], error: null }),
              1000
            );
          })
      );

      // Mock quick AI service response
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('service');
    });

    it('should validate AI service response format', async () => {
      // Mock successful database
      const { supabase } = require('../config/supabase');
      supabase.from().select().limit.mockResolvedValue({ data: [{ id: 1 }], error: null });

      // Mock malformed AI service response
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const response = await request(app)
        .get('/health/detailed')
        .expect(503);

      expect(response.body.ai_service).toBe('unhealthy');
      expect(response.body.dependencies.ai_service).toBe('disconnected');
    });
  });
});
