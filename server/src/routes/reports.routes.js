const router = require('express').Router();
const ctrl = require('../controllers/reports.controller');
const authenticate = require('../middleware/auth');

router.get('/summary', authenticate, ctrl.getSummary);
router.get('/room-utilization', authenticate, ctrl.getRoomUtilization);
router.get('/no-shows', authenticate, ctrl.getNoShows);

module.exports = router;
