const { ZodError } = require('zod');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    logger.warn(`Validation error on ${req.method} ${req.url}:`, err.errors);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Handle Bad JSON syntax
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn(`Malformed JSON in request: ${err.message}`);
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload'
    });
  }

  // Unhandled internal errors
  logger.error(`Internal server error on ${req.method} ${req.url}:`, err);
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
}

module.exports = errorHandler;
