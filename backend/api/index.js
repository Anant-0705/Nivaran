const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import security middleware
const { 
  corsOptions, 
  devCorsOptions,
  customSecurityHeaders,
  sanitizeInput,
  preventXSS,
  preventSQLInjection
} = require('../src/middleware/security');

// Import routes
const healthRoutes = require('../src/routes/health');
const authRoutes = require('../src/routes/auth');
const issueRoutes = require('../src/routes/issues');
const rewardRoutes = require('../src/routes/rewards');
const userRoutes = require('../src/routes/users');

const app = express();

// Enable trust proxy for Vercel
app.set('trust proxy', 1);

// Security headers
app.use(customSecurityHeaders);

// CORS configuration for Vercel
const vercelCorsOptions = {
  origin: [
    'http://localhost:19006',
    'https://localhost:19006',
    process.env.FRONTEND_URL,
    /\.vercel\.app$/,
    /localhost:19006$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

app.use(cors(vercelCorsOptions));

// Body parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Input sanitization and validation
app.use(sanitizeInput);
app.use(preventXSS);
app.use(preventSQLInjection);

// Health routes (no rate limiting for Vercel health checks)
app.use('/api/health', healthRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// Protected API routes
app.use('/api/issues', issueRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/users', userRoutes);

// AI Service Proxy (to external Railway/Render service)
app.use('/api/ai', async (req, res) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL;
    const internalApiKey = process.env.INTERNAL_API_KEY;
    
    if (!aiServiceUrl) {
      return res.status(500).json({ 
        error: 'AI service not configured',
        message: 'AI_SERVICE_URL environment variable is missing'
      });
    }

    // Construct the full URL for the AI service
    const fullUrl = `${aiServiceUrl}${req.path}`;
    
    console.log(`Proxying AI request to: ${fullUrl}`);

    // Use dynamic import for node-fetch
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Authorization': `Bearer ${internalApiKey}`,
        'User-Agent': 'Nivaran-Backend/1.0'
      },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
      timeout: 25000 // 25 second timeout for Vercel
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'AI service error',
        message: data.message || 'AI service request failed',
        details: data
      });
    }
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('AI service proxy error:', error);
    res.status(500).json({ 
      error: 'AI service unavailable',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Vercel function error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Export the Express app for Vercel
module.exports = app;