const express = require('express');
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/v1/auth/login   — public
router.post('/login', login);

// GET  /api/v1/auth/me      — protected
router.get('/me', protect, getMe);

module.exports = router;
