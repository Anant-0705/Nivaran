const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const dbConnection = require('../database/connection');

// Import Swagger documentation
const { swaggerSpec, swaggerUi, swaggerUiOptions } = require('./docs/swagger');

// Import security middleware
const { 
  securityHeaders, 
  corsOptions, 
  devCorsOptions,
  customSecurityHeaders,
  requestTiming,
  sanitizeInput,
  preventXSS,
  preventSQLInjection
} = require('./middleware/security');

const { 
  globalLimiter, 
  apiLimiter, 
  authLimiter, 
  speedLimiter 
} = require('./middleware/rateLimiter');

// Import health routes
const healthRoutes = require('./routes/health');

// Import API routes
const authRoutes = require('./routes/auth');
const issueRoutes = require('./routes/issues');
const rewardRoutes = require('./routes/rewards');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable trust proxy for accurate IP detection
app.set('trust proxy', 1);

// Request timing (must be first)
app.use(requestTiming);

// Security headers
app.use(securityHeaders);
app.use(customSecurityHeaders);

// CORS configuration (environment-specific)
if (process.env.NODE_ENV === 'development') {
  app.use(cors(devCorsOptions));
} else {
  app.use(cors(corsOptions));
}

// Rate limiting (apply global limiter to all routes)
app.use(globalLimiter);
app.use(speedLimiter);

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

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`🟢 [SERVER] ${req.method} ${req.url}`);
  console.log(`🟢 [SERVER] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`🟢 [SERVER] Body type:`, typeof req.body);
  next();
});

// Health and monitoring routes (no additional rate limiting)
app.use('/', healthRoutes);

// API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Redirect root to docs in development
if (process.env.NODE_ENV === 'development') {
  app.get('/', (req, res) => {
    res.redirect('/docs');
  });
}

// API routes with stricter rate limiting
app.use('/api', apiLimiter);

// Authentication routes with strictest rate limiting
app.use('/api/auth', authLimiter, authRoutes);

// Protected API routes
app.use('/api/issues', issueRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database connection pool initialized`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await dbConnection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  await dbConnection.close();
  process.exit(0);
});
