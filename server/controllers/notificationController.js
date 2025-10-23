const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { NotificationService } = require('../services/notificationService');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null
  } = req.query;

  const result = await NotificationService.getUserNotifications(req.user._id, {
    page: parseInt(page),
    limit: parseInt(limit),
    unreadOnly: unreadOnly === 'true',
    type
  });

  res.json({
    success: true,
    data: result
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.getUnreadCount(req.user._id);
  
  res.json({
    success: true,
    data: { count }
  });
});

// @desc    Mark notifications as read
// @route   PUT /api/notifications/mark-read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;

  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Notification IDs are required'
    });
  }

  const result = await NotificationService.markAsRead(req.user._id, notificationIds);

  res.json({
    success: true,
    data: {
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} notifications marked as read`
    }
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await NotificationService.markAllAsRead(req.user._id);

  res.json({
    success: true,
    data: {
      modifiedCount: result.modifiedCount,
      message: `All ${result.modifiedCount} notifications marked as read`
    }
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  await notification.deleteOne();

  // Emit real-time update
  if (global.io) {
    global.io.to(`user:${req.user._id}`).emit('notification:deleted', {
      notificationId: req.params.id
    });
  }

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
const getPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('preferences');
  
  const defaultPreferences = {
    email: true,
    push: true,
    emailTypes: {
      task_assigned: true,
      task_updated: true,
      task_completed: true,
      task_commented: true,
      project_invitation: true,
      project_updated: false,
      mention: true,
      deadline_reminder: true,
      team_member_joined: false,
      system_announcement: true
    },
    pushTypes: {
      task_assigned: true,
      task_updated: false,
      task_completed: false,
      task_commented: true,
      project_invitation: true,
      project_updated: false,
      mention: true,
      deadline_reminder: true,
      team_member_joined: false,
      system_announcement: false
    },
    digestFrequency: 'daily', // 'never', 'daily', 'weekly'
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  };

  const preferences = {
    ...defaultPreferences,
    ...user.preferences?.notifications
  };

  res.json({
    success: true,
    data: preferences
  });
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
  const {
    email,
    push,
    emailTypes,
    pushTypes,
    digestFrequency,
    quietHours
  } = req.body;

  const user = await User.findById(req.user._id);
  
  if (!user.preferences) {
    user.preferences = {};
  }
  
  if (!user.preferences.notifications) {
    user.preferences.notifications = {};
  }

  // Update preferences
  if (email !== undefined) user.preferences.notifications.email = email;
  if (push !== undefined) user.preferences.notifications.push = push;
  if (emailTypes) user.preferences.notifications.emailTypes = emailTypes;
  if (pushTypes) user.preferences.notifications.pushTypes = pushTypes;
  if (digestFrequency) user.preferences.notifications.digestFrequency = digestFrequency;
  if (quietHours) user.preferences.notifications.quietHours = quietHours;

  await user.save();

  res.json({
    success: true,
    data: user.preferences.notifications,
    message: 'Notification preferences updated successfully'
  });
});

// @desc    Send test notification
// @route   POST /api/notifications/test
// @access  Private
const sendTestNotification = asyncHandler(async (req, res) => {
  const { type = 'system_announcement' } = req.body;

  const notification = await NotificationService.createNotification({
    userId: req.user._id,
    type,
    title: 'Test Notification',
    message: 'This is a test notification to verify your notification settings.',
    data: {
      testMode: true,
      timestamp: new Date().toISOString()
    },
    actionUrl: '/settings/notifications',
    priority: 'medium',
    sendEmail: true,
    sendPush: true
  });

  res.json({
    success: true,
    data: notification,
    message: 'Test notification sent successfully'
  });
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
const getNotificationStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const [
    totalCount,
    unreadCount,
    todayCount,
    weekCount,
    typeStats
  ] = await Promise.all([
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, read: false }),
    Notification.countDocuments({
      userId,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    }),
    Notification.countDocuments({
      userId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    Notification.aggregate([
      { $match: { userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      total: totalCount,
      unread: unreadCount,
      today: todayCount,
      thisWeek: weekCount,
      byType: typeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    }
  });
});

// @desc    Export notifications
// @route   GET /api/notifications/export
// @access  Private
const exportNotifications = asyncHandler(async (req, res) => {
  const { format = 'json', startDate, endDate } = req.query;
  
  const query = { userId: req.user._id };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .lean();

  if (format === 'csv') {
    const csv = [
      'Date,Type,Title,Message,Read,Priority',
      ...notifications.map(n => 
        `"${n.createdAt}","${n.type}","${n.title}","${n.message}","${n.read}","${n.priority}"`
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="notifications.csv"');
    return res.send(csv);
  }

  res.json({
    success: true,
    data: notifications,
    count: notifications.length
  });
});

module.exports = {
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
};