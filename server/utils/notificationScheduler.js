const cron = require('node-cron');
const { NotificationService } = require('../services/notificationService');

class NotificationScheduler {
  static init() {
    console.log('Initializing notification scheduler...');

    // Send deadline reminders daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running deadline reminder job...');
      try {
        const results = await NotificationService.sendDeadlineReminders();
        console.log(`Sent ${results.length} deadline reminders`);
      } catch (error) {
        console.error('Failed to send deadline reminders:', error);
      }
    });

    // Clean up old notifications weekly on Sunday at 2 AM
    cron.schedule('0 2 * * 0', async () => {
      console.log('Running notification cleanup job...');
      try {
        const result = await NotificationService.cleanupOldNotifications(90);
        console.log(`Cleaned up ${result.deletedCount} old notifications`);
      } catch (error) {
        console.error('Failed to clean up old notifications:', error);
      }
    });

    // Send daily digest emails at 8 AM (placeholder for future implementation)
    cron.schedule('0 8 * * *', async () => {
      console.log('Daily digest job placeholder - not implemented yet');
      // TODO: Implement daily digest functionality
    });

    console.log('Notification scheduler initialized successfully');
  }

  static stop() {
    cron.getTasks().forEach(task => task.stop());
    console.log('Notification scheduler stopped');
  }
}

module.exports = NotificationScheduler;