const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Global rate limiter - applies to all routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60), // 15 minutes in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health') || req.path.startsWith('/ready') || req.path.startsWith('/live');
  },
});

// API rate limiter - stricter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for API calls
  message: {
    error: 'API rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(15 * 60),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiter - very strict for login attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: Math.ceil(15 * 60),
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Speed limiter - progressively slow down repeat requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: () => 100, // Add 100ms delay per request after delayAfter
  maxDelayMs: 2000, // Maximum delay of 2 seconds
  validate: { delayMs: false }, // Disable the delayMs warning
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: {
    error: 'Upload rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  apiLimiter,
  authLimiter,
  speedLimiter,
  uploadLimiter,
};