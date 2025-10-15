// Global error handling middleware

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Default error status and message
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};

