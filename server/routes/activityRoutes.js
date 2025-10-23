const express = require('express');
const router = express.Router();
const { getActivities, getRecentActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// @route   GET /api/activities
// @desc    Get activities for user's projects
// @access  Private
router.get('/', getActivities);

// @route   GET /api/activities/recent
// @desc    Get recent activities
// @access  Private
router.get('/recent', getRecentActivities);

module.exports = router;
