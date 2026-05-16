const router = require('express').Router();
const { getAvailability } = require('../controllers/availability.controller');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, getAvailability);

module.exports = router;
