const express = require('express');
const router = express.Router();
const { register, login, getMe, refresh, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
