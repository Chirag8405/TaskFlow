const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('../utils/emailService');

// Notification types
const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  TASK_COMMENTED: 'task_commented',
  PROJECT_INVITATION: 'project_invitation',
  PROJECT_UPDATED: 'project_updated',
  MENTION: 'mention',
  DEADLINE_REMINDER: 'deadline_reminder',
  TEAM_MEMBER_JOINED: 'team_member_joined',
  SYSTEM_ANNOUNCEMENT: 'system_announcement'
};

// Notification priorities
const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

class NotificationService {
  // Create a new notification
  static async createNotification({
    userId,
    type,
    title,
    message,
    data = {},
    priority = NOTIFICATION_PRIORITIES.MEDIUM,
    actionUrl = null,
    sendEmail = true,
    sendPush = false
  }) {
    try {
      // Create in-app notification
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        data,
        priority,
        actionUrl,
        createdAt: new Date()
      });

      await notification.save();

      // Get user preferences
      const user = await User.findById(userId).select('email preferences');
      if (!user) {
        console.error(`User not found: ${userId}`);
        return notification;
      }

      const preferences = user.preferences?.notifications || {};

      // Send email notification if enabled
      if (sendEmail && preferences.email !== false && this.shouldSendEmailForType(type, preferences)) {
        await this.sendEmailNotification(user, type, {
          title,
          message,
          data,
          actionUrl
        });
      }

      // Send push notification if enabled (placeholder for future implementation)
      if (sendPush && preferences.push !== false) {
        await this.sendPushNotification(user, {
          title,
          message,
          data,
          actionUrl
        });
      }

      // Emit real-time notification via Socket.io
      if (global.io) {
        global.io.to(`user:${userId}`).emit('notification', {
          id: notification._id,
          type,
          title,
          message,
          data,
          priority,
          actionUrl,
          createdAt: notification.createdAt
        });
      }

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  // Send email notification
  static async sendEmailNotification(user, type, notificationData) {
    try {
      const emailTemplateMap = {
        [NOTIFICATION_TYPES.TASK_ASSIGNED]: 'taskAssigned',
        [NOTIFICATION_TYPES.TASK_UPDATED]: 'taskUpdated',
        [NOTIFICATION_TYPES.TASK_COMPLETED]: 'taskCompleted',
        [NOTIFICATION_TYPES.PROJECT_INVITATION]: 'projectInvitation',
        [NOTIFICATION_TYPES.MENTION]: 'mention'
      };

      const templateName = emailTemplateMap[type];
      if (!templateName) {
        console.log(`No email template for notification type: ${type}`);
        return;
      }

      const emailData = {
        userName: user.name,
        userEmail: user.email,
        ...notificationData.data
      };

      const result = await emailService.sendEmailNotification(user.email, templateName, emailData);
      
      if (result.success) {
        console.log(`Email sent successfully to ${user.email} for ${type}`);
        if (result.previewUrl) {
          console.log(`Preview URL: ${result.previewUrl}`);
        }
      } else {
        console.error(`Failed to send email to ${user.email}:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('Email notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send push notification (placeholder)
  static async sendPushNotification(user, notificationData) {
    // Placeholder for push notification implementation
    // This would integrate with services like Firebase Cloud Messaging, OneSignal, etc.
    console.log(`Push notification would be sent to ${user.email}:`, notificationData.title);
    return { success: true, message: 'Push notification sent' };
  }

  // Check if email should be sent for this notification type
  static shouldSendEmailForType(type, preferences) {
    const emailPreferences = preferences.emailTypes || {};
    
    // Default email preferences
    const defaults = {
      [NOTIFICATION_TYPES.TASK_ASSIGNED]: true,
      [NOTIFICATION_TYPES.TASK_UPDATED]: true,
      [NOTIFICATION_TYPES.TASK_COMPLETED]: true,
      [NOTIFICATION_TYPES.PROJECT_INVITATION]: true,
      [NOTIFICATION_TYPES.MENTION]: true,
      [NOTIFICATION_TYPES.DEADLINE_REMINDER]: true,
      [NOTIFICATION_TYPES.TEAM_MEMBER_JOINED]: false,
      [NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT]: true
    };

    return emailPreferences[type] !== undefined ? emailPreferences[type] : defaults[type];
  }

  // Send notification to multiple users
  static async sendBulkNotification(userIds, notificationData) {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const notification = await this.createNotification({
          userId,
          ...notificationData
        });
        results.push({ userId, success: true, notification });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return results;
  }

  // Task-specific notification helpers
  static async notifyTaskAssigned(task, assigneeId, assignedBy) {
    if (!assigneeId || assigneeId.toString() === assignedBy.toString()) {
      return; // Don't notify if no assignee or self-assignment
    }

    return await this.createNotification({
      userId: assigneeId,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `You have been assigned the task "${task.title}"`,
      data: {
        taskId: task._id,
        taskTitle: task.title,
        taskDescription: task.description,
        projectId: task.project,
        projectName: task.projectName || 'Unknown Project',
        priority: task.priority,
        dueDate: task.dueDate,
        assignedBy: assignedBy.name || 'Someone'
      },
      actionUrl: `/projects/${task.project}/tasks/${task._id}`,
      priority: task.priority === 'high' ? NOTIFICATION_PRIORITIES.HIGH : NOTIFICATION_PRIORITIES.MEDIUM
    });
  }

  static async notifyTaskUpdated(task, updatedBy, changes = []) {
    if (!task.assignedTo || task.assignedTo.toString() === updatedBy._id.toString()) {
      return; // Don't notify if no assignee or self-update
    }

    return await this.createNotification({
      userId: task.assignedTo,
      type: NOTIFICATION_TYPES.TASK_UPDATED,
      title: 'Task Updated',
      message: `Task "${task.title}" has been updated`,
      data: {
        taskId: task._id,
        taskTitle: task.title,
        projectId: task.project,
        updatedBy: updatedBy.name,
        changes
      },
      actionUrl: `/projects/${task.project}/tasks/${task._id}`,
      priority: NOTIFICATION_PRIORITIES.MEDIUM
    });
  }

  static async notifyTaskCompleted(task, completedBy) {
    // Notify project members
    const projectMembers = task.projectMembers || [];
    const notifiableMembers = projectMembers.filter(
      memberId => memberId.toString() !== completedBy._id.toString()
    );

    if (notifiableMembers.length === 0) return;

    return await this.sendBulkNotification(notifiableMembers, {
      type: NOTIFICATION_TYPES.TASK_COMPLETED,
      title: 'Task Completed',
      message: `Task "${task.title}" has been completed`,
      data: {
        taskId: task._id,
        taskTitle: task.title,
        projectId: task.project,
        projectName: task.projectName || 'Unknown Project',
        completedBy: completedBy.name
      },
      actionUrl: `/projects/${task.project}`,
      priority: NOTIFICATION_PRIORITIES.LOW
    });
  }

  static async notifyMention(task, mentionedUserId, mentionedBy, commentText) {
    if (mentionedUserId.toString() === mentionedBy._id.toString()) {
      return; // Don't notify if user mentions themselves
    }

    return await this.createNotification({
      userId: mentionedUserId,
      type: NOTIFICATION_TYPES.MENTION,
      title: 'You were mentioned',
      message: `${mentionedBy.name} mentioned you in a comment`,
      data: {
        taskId: task._id,
        taskTitle: task.title,
        projectId: task.project,
        mentionedBy: mentionedBy.name,
        commentText
      },
      actionUrl: `/projects/${task.project}/tasks/${task._id}`,
      priority: NOTIFICATION_PRIORITIES.HIGH
    });
  }

  static async notifyProjectInvitation(project, invitedUserId, invitedBy) {
    return await this.createNotification({
      userId: invitedUserId,
      type: NOTIFICATION_TYPES.PROJECT_INVITATION,
      title: 'Project Invitation',
      message: `You have been invited to join "${project.name}"`,
      data: {
        projectId: project._id,
        projectName: project.name,
        projectDescription: project.description,
        invitedBy: invitedBy.name
      },
      actionUrl: `/projects/${project._id}`,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      sendEmail: true
    });
  }

  // Get user notifications with pagination
  static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const query = { userId };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return {
      notifications,
      total,
      unreadCount,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    };
  }

  // Mark notifications as read
  static async markAsRead(userId, notificationIds) {
    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        userId
      },
      { read: true, readAt: new Date() }
    );

    // Emit real-time update
    if (global.io) {
      global.io.to(`user:${userId}`).emit('notifications:marked_read', {
        notificationIds,
        count: result.modifiedCount
      });
    }

    return result;
  }

  // Mark all notifications as read
  static async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );

    // Emit real-time update
    if (global.io) {
      global.io.to(`user:${userId}`).emit('notifications:all_marked_read', {
        count: result.modifiedCount
      });
    }

    return result;
  }

  // Delete old notifications
  static async cleanupOldNotifications(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true
    });

    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result;
  }

  // Send deadline reminders
  static async sendDeadlineReminders() {
    const Task = require('../models/Task');
    
    // Find tasks due in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingTasks = await Task.find({
      dueDate: {
        $gte: new Date(),
        $lte: tomorrow
      },
      status: { $ne: 'completed' },
      assignedTo: { $exists: true }
    }).populate('assignedTo project');

    const results = [];
    
    for (const task of upcomingTasks) {
      try {
        await this.createNotification({
          userId: task.assignedTo._id,
          type: NOTIFICATION_TYPES.DEADLINE_REMINDER,
          title: 'Task Due Soon',
          message: `Task "${task.title}" is due within 24 hours`,
          data: {
            taskId: task._id,
            taskTitle: task.title,
            projectId: task.project._id,
            projectName: task.project.name,
            dueDate: task.dueDate
          },
          actionUrl: `/projects/${task.project._id}/tasks/${task._id}`,
          priority: NOTIFICATION_PRIORITIES.HIGH
        });
        
        results.push({ taskId: task._id, success: true });
      } catch (error) {
        results.push({ taskId: task._id, success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = {
  NotificationService,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES
};