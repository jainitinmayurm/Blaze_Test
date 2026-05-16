const { validationResult } = require('express-validator');

/**
 * Middleware to run after express-validator checks.
 * Returns 400 with structured error messages if validation fails.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
}

module.exports = validate;
