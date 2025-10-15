// Security middleware for XSS protection and input sanitization

/**
 * Sanitize string to prevent XSS attacks
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  // Remove script tags and their content
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  str = str.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  str = str.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  str = str.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  str = str.replace(/data:text\/html/gi, '');
  
  return str;
}

/**
 * Deep sanitize object recursively
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Middleware to sanitize request body
 */
function sanitizeRequest(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
}

/**
 * Security headers middleware (CSP, XSS Protection, etc.)
 */
function securityHeaders(req, res, next) {
  // Content Security Policy - prevents inline scripts
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +  // Allow inline scripts for our app
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
}

/**
 * Validate that input doesn't contain dangerous patterns
 */
function validateNoScripts(value) {
  if (typeof value !== 'string') return true;
  
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(value));
}

/**
 * Middleware to block requests with script injection attempts
 */
function blockScriptInjection(req, res, next) {
  const checkValue = (value, path = '') => {
    if (typeof value === 'string') {
      if (!validateNoScripts(value)) {
        console.warn(`⚠️  Script injection attempt detected in ${path}:`, value);
        return false;
      }
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (!checkValue(value[i], `${path}[${i}]`)) {
          return false;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        if (value.hasOwnProperty(key)) {
          if (!checkValue(value[key], path ? `${path}.${key}` : key)) {
            return false;
          }
        }
      }
    }
    return true;
  };
  
  // Check body
  if (req.body && !checkValue(req.body, 'body')) {
    return res.status(400).json({
      success: false,
      error: 'Potentially malicious content detected. Script tags and event handlers are not allowed.'
    });
  }
  
  // Check query params
  if (req.query && !checkValue(req.query, 'query')) {
    return res.status(400).json({
      success: false,
      error: 'Potentially malicious content detected in query parameters.'
    });
  }
  
  next();
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeRequest,
  securityHeaders,
  validateNoScripts,
  blockScriptInjection
};

