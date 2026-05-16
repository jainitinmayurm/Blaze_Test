const { body } = require('express-validator');

/**
 * Validation rules for creating/editing a room.
 */
const roomRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Room name is required.'),

  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Room capacity must be a positive integer.'),

  body('equipment')
    .optional({ nullable: true })
    .isString()
    .withMessage('Equipment must be a JSON string array.'),

  body('location')
    .optional({ nullable: true })
    .isString(),
];

module.exports = { roomRules };
