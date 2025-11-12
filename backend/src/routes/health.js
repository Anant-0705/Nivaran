const express = require('express');
const { supabase } = require('../config/supabase');
const dbConnection = require('../../database/connection');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check endpoint
 *     description: Returns basic service status and uptime information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Service uptime in seconds
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *             example:
 *               status: healthy
 *               timestamp: "2024-01-15T10:30:00Z"
 *               uptime: 3600
 *               version: "1.0.0"
 *               environment: development
 */

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check with dependencies
 *     description: Returns comprehensive health status including database and AI service connectivity
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: All services are healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               service: healthy
 *               database: healthy
 *               connection_pool:
 *                 totalCount: 5
 *                 idleCount: 3
 *                 waitingCount: 0
 *               ai_service: healthy
 *               timestamp: "2024-01-15T10:30:00Z"
 *               uptime: 3600
 *               version: "1.0.0"
 *               environment: production
 *       503:
 *         description: One or more services are unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *             example:
 *               service: degraded
 *               database: unhealthy
 *               ai_service: healthy
 *               timestamp: "2024-01-15T10:30:00Z"
 */
// Detailed health check with dependencies
router.get('/health/detailed', async (req, res) => {
  const checks = {
    service: 'healthy',
    database: 'unknown',
    connection_pool: 'unknown',
    ai_service: 'unknown',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // Check database connection using our connection manager
  try {
    const dbHealth = await dbConnection.healthCheck();
    checks.database = dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy';
    checks.connection_pool = dbHealth.poolInfo;
    checks.database_response_time = dbHealth.responseTime;
    
    if (dbHealth.status !== 'healthy') {
      checks.service = 'degraded';
    }
  } catch (error) {
    checks.database = 'unhealthy';
    checks.service = 'degraded';
  }

  // Check AI service connection
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${aiServiceUrl}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    
    if (response.ok) {
      checks.ai_service = 'healthy';
    } else {
      checks.ai_service = 'unhealthy';
      checks.service = 'degraded';
    }
  } catch (error) {
    checks.ai_service = 'unhealthy';
    checks.service = 'degraded';
  }

  const statusCode = checks.service === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
});

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Kubernetes readiness probe
 *     description: Checks if the service is ready to handle requests
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                 pool_stats:
 *                   type: object
 *       503:
 *         description: Service is not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: not ready
 *                 error:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check if the service is ready to handle requests using our connection manager
    const dbHealth = await dbConnection.healthCheck();
    
    if (dbHealth.status !== 'healthy') {
      throw new Error(dbHealth.error || 'Database not ready');
    }
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      database: dbHealth.status,
      pool_stats: dbHealth.poolInfo
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /live:
 *   get:
 *     summary: Kubernetes liveness probe
 *     description: Checks if the service process is alive and responsive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: alive
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 pid:
 *                   type: integer
 *                   description: Process ID
 *                 memory:
 *                   type: object
 *                   description: Memory usage statistics
 *                   properties:
 *                     rss:
 *                       type: integer
 *                     heapTotal:
 *                       type: integer
 *                     heapUsed:
 *                       type: integer
 *                     external:
 *                       type: integer
 */
// Liveness probe
router.get('/live', (req, res) => {
  // Basic liveness check - if this responds, the service is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    memory: process.memoryUsage(),
  });
});

module.exports = router;