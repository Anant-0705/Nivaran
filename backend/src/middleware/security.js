const helmet = require('helmet');
const cors = require('cors');

// Security headers configuration
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options
  noSniff: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-XSS-Protection (legacy browsers)
  xssFilter: true,

  // X-Download-Options
  ieNoOpen: true,

  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Remove X-Powered-By header
  hidePoweredBy: true,
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from these origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:19006',
      'exp://192.168.1.100:8081', // Expo development
      process.env.FRONTEND_URL,
      process.env.ADMIN_PANEL_URL,
    ].filter(Boolean); // Remove undefined values

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
  ],
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// Development CORS (less restrictive)
const devCorsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: true,
};

// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Always allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }

    console.warn(`Access denied for IP: ${clientIP}`);
    return res.status(403).json({
      error: 'Access denied',
      message: 'Your IP address is not authorized to access this resource',
    });
  };
};

// Request size limiter
const requestSizeLimiter = {
  // JSON body size limit
  json: { limit: '10mb' },
  
  // URL-encoded body size limit
  urlencoded: { limit: '10mb', extended: true },
  
  // File upload size limit (handled by multer middleware)
  fileUpload: 5 * 1024 * 1024, // 5MB
};

// Security middleware to add custom headers
const customSecurityHeaders = (req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Add custom security headers
  res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');
  res.setHeader('X-Response-Time', Date.now() - req.startTime + 'ms');
  
  // Prevent MIME type confusion
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  next();
};

// Request timing middleware
const requestTiming = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

// Sanitize user input to prevent XSS
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Basic XSS prevention - remove script tags and javascript: protocol
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    }
    
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          obj[key] = sanitize(obj[key]);
        }
      }
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

// Prevent XSS attacks
const preventXSS = (req, res, next) => {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
    /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
    /<embed[\s\S]*?>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi,
    /onmouseover=/gi,
  ];

  const checkForXSS = (obj) => {
    if (typeof obj === 'string') {
      for (const pattern of xssPatterns) {
        if (pattern.test(obj)) {
          return true;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key) && checkForXSS(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  // Check request body, query, and params
  if (checkForXSS(req.body) || checkForXSS(req.query) || checkForXSS(req.params)) {
    return res.status(400).json({
      error: 'Invalid input detected',
      message: 'Request contains potentially malicious content'
    });
  }

  next();
};

// Prevent SQL injection attacks
const preventSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union|script)\b)/gi,
    /((\%27)|(\'))|(\-\-)|(\%23)|(#)/gi,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|((\%3B)|(;)))/gi,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    /((\%27)|(\'))union/gi,
  ];

  const checkForSQLInjection = (obj) => {
    if (typeof obj === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(obj)) {
          return true;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key) && checkForSQLInjection(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  // Check request body, query, and params
  if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query) || checkForSQLInjection(req.params)) {
    return res.status(400).json({
      error: 'Invalid input detected',
      message: 'Request contains potentially malicious SQL patterns'
    });
  }

  next();
};

module.exports = {
  securityHeaders,
  corsOptions,
  devCorsOptions,
  ipWhitelist,
  requestSizeLimiter,
  customSecurityHeaders,
  requestTiming,
  sanitizeInput,
  preventXSS,
  preventSQLInjection,
};
