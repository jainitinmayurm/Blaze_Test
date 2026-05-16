const router = require('express').Router();
const { getCalendarFeed } = require('../controllers/calendar.controller');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, getCalendarFeed);

module.exports = router;
