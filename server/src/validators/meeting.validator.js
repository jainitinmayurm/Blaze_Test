const { body } = require('express-validator');

/**
 * Validation rules for creating a meeting.
 */
const createMeetingRules = [
  body('title')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Meeting title is mandatory and must be at least 3 characters.'),

  body('type')
    .isIn(['online', 'offline'])
    .withMessage('Meeting type must be "online" or "offline".'),

  body('start_time')
    .isISO8601()
    .withMessage('start_time must be a valid ISO 8601 datetime.')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('start_time must be in the future.');
      }
      return true;
    }),

  body('end_time')
    .isISO8601()
    .withMessage('end_time must be a valid ISO 8601 datetime.'),

  body('end_time').custom((value, { req }) => {
    if (new Date(value) <= new Date(req.body.start_time)) {
      throw new Error('end_time must be strictly after start_time.');
    }
    return true;
  }),

  body('participants')
    .isArray({ min: 1 })
    .withMessage('At least one participant (other than the organizer) is required.'),

  body('participants.*')
    .isInt({ min: 1 })
    .withMessage('Each participant must be a valid user ID.'),

  body('room_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('room_id must be a valid room ID.'),

  body('online_link')
    .optional({ nullable: true })
    .isString(),

  body('agenda')
    .optional({ nullable: true })
    .isString(),

  body('recurrence')
    .optional({ nullable: true })
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('recurrence must be "daily", "weekly", or "monthly".'),

  body('recurrence_end')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('recurrence_end must be a valid date.'),
];

/**
 * Validation rules for updating a meeting.
 */
const updateMeetingRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Meeting title must be at least 3 characters.'),

  body('type')
    .optional()
    .isIn(['online', 'offline'])
    .withMessage('Meeting type must be "online" or "offline".'),

  body('start_time')
    .optional()
    .isISO8601()
    .withMessage('start_time must be a valid ISO 8601 datetime.')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('start_time must be in the future.');
      }
      return true;
    }),

  body('end_time')
    .optional()
    .isISO8601()
    .withMessage('end_time must be a valid ISO 8601 datetime.'),

  body('participants')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one participant is required.'),

  body('participants.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each participant must be a valid user ID.'),

  body('status')
    .optional()
    .isIn(['Draft', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'])
    .withMessage('Invalid status value.'),
];

module.exports = { createMeetingRules, updateMeetingRules };
