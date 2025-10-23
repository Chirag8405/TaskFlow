const express = require('express');
const router = express.Router();

// Import middleware
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const Joi = require('joi');

// Import controllers
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  sendTestNotification,
  getNotificationStats,
  exportNotifications
} = require('../controllers/notificationController');

// Validation schemas
const markReadSchema = Joi.object({
  notificationIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .max(100)
    .required()
});

const preferencesSchema = Joi.object({
  email: Joi.boolean(),
  push: Joi.boolean(),
  emailTypes: Joi.object({
    task_assigned: Joi.boolean(),
    task_updated: Joi.boolean(),
    task_completed: Joi.boolean(),
    task_commented: Joi.boolean(),
    project_invitation: Joi.boolean(),
    project_updated: Joi.boolean(),
    mention: Joi.boolean(),
    deadline_reminder: Joi.boolean(),
    team_member_joined: Joi.boolean(),
    system_announcement: Joi.boolean()
  }),
  pushTypes: Joi.object({
    task_assigned: Joi.boolean(),
    task_updated: Joi.boolean(),
    task_completed: Joi.boolean(),
    task_commented: Joi.boolean(),
    project_invitation: Joi.boolean(),
    project_updated: Joi.boolean(),
    mention: Joi.boolean(),
    deadline_reminder: Joi.boolean(),
    team_member_joined: Joi.boolean(),
    system_announcement: Joi.boolean()
  }),
  digestFrequency: Joi.string().valid('never', 'daily', 'weekly'),
  quietHours: Joi.object({
    enabled: Joi.boolean(),
    start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  })
});

const testNotificationSchema = Joi.object({
  type: Joi.string()
    .valid(
      'task_assigned',
      'task_updated',
      'task_completed',
      'task_commented',
      'project_invitation',
      'project_updated',
      'mention',
      'deadline_reminder',
      'team_member_joined',
      'system_announcement'
    )
    .default('system_announcement')
});

const idSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
});

// @route   GET /api/notifications
// @desc    Get user notifications with pagination and filtering
// @access  Private
router.get('/', protect, getNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', protect, getUnreadCount);

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
// @access  Private
router.get('/stats', protect, getNotificationStats);

// @route   GET /api/notifications/preferences
// @desc    Get notification preferences
// @access  Private
router.get('/preferences', protect, getPreferences);

// @route   PUT /api/notifications/preferences
// @desc    Update notification preferences
// @access  Private
router.put('/preferences', protect, validate(preferencesSchema), updatePreferences);

// @route   PUT /api/notifications/mark-read
// @desc    Mark specific notifications as read
// @access  Private
router.put('/mark-read', protect, validate(markReadSchema), markAsRead);

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', protect, markAllAsRead);

// @route   POST /api/notifications/test
// @desc    Send test notification
// @access  Private
router.post('/test', protect, validate(testNotificationSchema), sendTestNotification);

// @route   GET /api/notifications/export
// @desc    Export notifications data
// @access  Private
router.get('/export', protect, exportNotifications);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', protect, validate(idSchema, 'params'), deleteNotification);

module.exports = router;