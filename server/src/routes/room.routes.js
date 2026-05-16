const router = require('express').Router();
const ctrl = require('../controllers/room.controller');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const validate = require('../middleware/validate');
const { roomRules } = require('../validators/room.validator');

router.get('/', authenticate, ctrl.listRooms);
router.post('/', authenticate, adminOnly, roomRules, validate, ctrl.createRoom);
router.put('/:id', authenticate, adminOnly, roomRules, validate, ctrl.updateRoom);
router.get('/:id/availability', authenticate, ctrl.getRoomAvailability);

module.exports = router;
