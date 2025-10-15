// Authentication middleware
// Validates cookie-based authorization

const authService = require('../services/authService');

/**
 * Middleware to require authentication
 */
function requireAuth(req, res, next) {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please configure your credentials in settings.'
    });
  }

  if (!authService.validateSession(token)) {
    // Clear invalid cookie
    res.clearCookie('authToken');
    return res.status(401).json({
      success: false,
      error: 'Session expired or invalid. Please reconfigure your credentials.'
    });
  }

  // Session is valid, continue
  next();
}

/**
 * Optional authentication - doesn't block if not authenticated
 */
function optionalAuth(req, res, next) {
  const token = req.cookies.authToken;

  if (token) {
    req.isAuthenticated = authService.validateSession(token);
  } else {
    req.isAuthenticated = false;
  }

  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};

