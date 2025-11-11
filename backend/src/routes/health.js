const express = require('express');
const { supabase } = require('../config/supabase');

const router = express.Router();

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

// Detailed health check with dependencies
router.get('/health/detailed', async (req, res) => {
  const checks = {
    service: 'healthy',
    database: 'unknown',
    ai_service: 'unknown',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // Check database connection
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    checks.database = 'healthy';
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

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check if the service is ready to handle requests
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

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