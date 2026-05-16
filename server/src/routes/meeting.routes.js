const router = require('express').Router();
const ctrl = require('../controllers/meeting.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createMeetingRules, updateMeetingRules } = require('../validators/meeting.validator');

router.post('/', authenticate, createMeetingRules, validate, ctrl.createMeeting);
router.get('/', authenticate, ctrl.listMeetings);
router.get('/:id', authenticate, ctrl.getMeeting);
router.put('/:id', authenticate, updateMeetingRules, validate, ctrl.updateMeeting);
router.delete('/:id', authenticate, ctrl.cancelMeeting);
router.put('/:id/respond', authenticate, ctrl.respondToMeeting);

module.exports = router;
