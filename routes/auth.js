const express = require('express');
const { body } = require('express-validator');
const { register, login, getCurrentUser } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Register new user (Admin only)
router.post('/register', adminOnly, protect, [
  body('name', 'Name is required').trim().notEmpty(),
  body('email', 'Valid email is required').isEmail().normalizeEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  body('role', 'Role must be admin or staff').isIn(['admin', 'staff'])
], register);

// Login
router.post('/login', [
  body('email', 'Valid email is required').isEmail().normalizeEmail(),
  body('password', 'Password is required').notEmpty()
], login);

// Get current user info
router.get('/me', protect, getCurrentUser);

module.exports = router;
