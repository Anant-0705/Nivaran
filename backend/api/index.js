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
const aiRoutes = require('../src/routes/aiRoutes');

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
app.use('/api/ai', aiRoutes);

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