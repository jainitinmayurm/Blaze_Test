const router = require('express').Router();
const { register, login, getMe, listUsers } = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, listUsers);

module.exports = router;
