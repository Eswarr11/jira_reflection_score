// Validation middleware for API requests

/**
 * Validate request body has required fields
 */
function validateRequestBody(requiredFields = []) {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    next();
  };
}

module.exports = {
  validateRequestBody
};
