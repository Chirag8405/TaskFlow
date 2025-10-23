const express = require('express');
const router = express.Router();

// Import middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { 
  userSchemas, 
  idSchema 
} = require('../utils/validationSchemas');

// Import controllers
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getAssignableUsers,
  getOnlineUsers,
  searchUsers,
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  uploadAvatar
} = require('../controllers/userController');

// @route   GET /api/users
// @desc    Get all users with pagination and filtering
// @access  Private
router.get('/', protect, getUsers);

// @route   GET /api/users/assignable
// @desc    Get users for task assignment
// @access  Private
router.get('/assignable', protect, getAssignableUsers);

// @route   GET /api/users/online
// @desc    Get currently online users
// @access  Private
router.get('/online', protect, getOnlineUsers);

// @route   GET /api/users/search
// @desc    Search users by name or email
// @access  Private
router.get('/search', protect, searchUsers);

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, getProfile);

// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put('/profile', protect, validate(userSchemas.updateProfile), updateProfile);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', protect, validate(userSchemas.updateProfile), updatePreferences);

// @route   PUT /api/users/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', protect, changePassword);

// @route   POST /api/users/avatar
// @desc    Upload avatar
// @access  Private
router.post('/avatar', protect, uploadAvatar);

// @route   GET /api/users/:id
// @desc    Get single user by ID
// @access  Private
router.get('/:id', protect, validate(idSchema, 'params'), getUserById);

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private/Admin
router.put('/:id', protect, adminOnly, validate(idSchema, 'params'), validate(userSchemas.updateProfile), updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, validate(idSchema, 'params'), deleteUser);

module.exports = router;