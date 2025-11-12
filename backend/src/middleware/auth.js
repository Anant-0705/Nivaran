const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { AppError } = require('../utils/errors');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next(new AppError('Access token required', 401, 'NO_TOKEN'));
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return next(new AppError('Invalid or expired token', 401, 'INVALID_TOKEN'));
    }

    // Add user info to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return next(new AppError('Authentication failed', 401, 'AUTH_FAILED'));
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth errors, just log them
    console.warn('Optional auth error:', error.message);
    next();
  }
};

// Role-based authorization
const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
      }

      // Get user role from database
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', req.user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return next(new AppError('Authorization check failed', 500, 'AUTH_CHECK_FAILED'));
      }

      const userRole = profile?.role || 'user';

      if (!allowedRoles.includes(userRole)) {
        return next(new AppError(
          'Insufficient permissions',
          403,
          'INSUFFICIENT_PERMISSIONS',
          { required: allowedRoles, current: userRole }
        ));
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return next(new AppError('Authorization failed', 500, 'AUTHORIZATION_FAILED'));
    }
  };
};

// Resource ownership check
const requireOwnership = (resourceType = 'resource') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        return next(new AppError('Resource ID required', 400, 'RESOURCE_ID_REQUIRED'));
      }

      let tableName, ownerField;
      
      switch (resourceType) {
        case 'report':
          tableName = 'reports';
          ownerField = 'user_id';
          break;
        case 'comment':
          tableName = 'comments';
          ownerField = 'user_id';
          break;
        case 'profile':
          tableName = 'user_profiles';
          ownerField = 'user_id';
          break;
        default:
          return next(new AppError('Invalid resource type', 400, 'INVALID_RESOURCE_TYPE'));
      }

      // Check if user owns the resource
      const { data: resource, error } = await supabase
        .from(tableName)
        .select(ownerField)
        .eq('id', resourceId)
        .single();

      if (error) {
        console.error(`Error checking ${resourceType} ownership:`, error);
        return next(new AppError(`${resourceType} not found`, 404, 'RESOURCE_NOT_FOUND'));
      }

      if (resource[ownerField] !== req.user.id) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', req.user.id)
          .single();

        const userRole = profile?.role || 'user';
        
        if (!['admin', 'moderator'].includes(userRole)) {
          return next(new AppError(
            `You don't have permission to access this ${resourceType}`,
            403,
            'ACCESS_DENIED'
          ));
        }
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return next(new AppError('Ownership verification failed', 500, 'OWNERSHIP_CHECK_FAILED'));
    }
  };
};

// API key authentication (for external services)
const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return next(new AppError('API key required', 401, 'API_KEY_REQUIRED'));
  }

  const validAPIKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
  
  if (!validAPIKeys.includes(apiKey)) {
    return next(new AppError('Invalid API key', 401, 'INVALID_API_KEY'));
  }

  req.apiKeyAuth = true;
  next();
};

// Session validation
const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    // Check if session is still valid
    const { data: session, error } = await supabase.auth.getSession();
    
    if (error || !session?.session) {
      return next(new AppError('Session expired', 401, 'SESSION_EXPIRED'));
    }

    // Update last activity timestamp
    await supabase
      .from('user_profiles')
      .update({ last_activity: new Date().toISOString() })
      .eq('user_id', req.user.id);

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    return next(new AppError('Session validation failed', 500, 'SESSION_VALIDATION_FAILED'));
  }
};

// Rate limiting based on user
const userBasedRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, data] of userRequests.entries()) {
      if (now - data.resetTime > windowMs) {
        userRequests.delete(key);
      }
    }

    // Check user's request count
    const userData = userRequests.get(userId) || { count: 0, resetTime: now };
    
    if (now - userData.resetTime > windowMs) {
      userData.count = 0;
      userData.resetTime = now;
    }

    userData.count++;
    userRequests.set(userId, userData);

    if (userData.count > maxRequests) {
      return next(new AppError(
        'Rate limit exceeded for user',
        429,
        'USER_RATE_LIMIT_EXCEEDED',
        { retryAfter: Math.ceil((windowMs - (now - userData.resetTime)) / 1000) }
      ));
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authorizeRoles,
  requireOwnership,
  authenticateAPIKey,
  validateSession,
  userBasedRateLimit,
};
