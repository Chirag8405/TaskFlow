const express = require('express');
const router = express.Router();

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const { 
  validate, 
  sanitizeInput, 
  validatePasswordStrength, 
  validateEmail 
} = require('../middleware/validationMiddleware');
const { userSchemas } = require('../utils/validationSchemas');

// Import controllers
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  logoutUser,
  changePassword,
  refreshToken
} = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validate(userSchemas.register), registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validate(userSchemas.login), loginUser);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/me
// @desc    Update user profile
// @access  Private
router.put('/me', 
  protect, 
  sanitizeInput,
  validate(userSchemas.updateProfile),
  validateEmail,
  updateProfile
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, logoutUser);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', 
  protect,
  sanitizeInput,
  validate(userSchemas.changePassword),
  validatePasswordStrength,
  changePassword
);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', protect, refreshToken);

module.exports = router;