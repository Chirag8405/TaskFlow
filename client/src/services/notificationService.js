import { api } from './api';

class NotificationService {
  // Get notifications with pagination and filtering
  async getNotifications(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key].toString());
      }
    });

    const response = await api.get(`/notifications?${queryParams.toString()}`);
    return response.data;
  }

  // Get unread notification count
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  }

  // Mark specific notifications as read
  async markAsRead(notificationIds) {
    const response = await api.put('/notifications/mark-read', {
      notificationIds
    });
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  }

  // Delete notification
  async deleteNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  // Get notification preferences
  async getPreferences() {
    const response = await api.get('/notifications/preferences');
    return response.data;
  }

  // Update notification preferences
  async updatePreferences(preferences) {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  }

  // Send test notification
  async sendTestNotification(type = 'system_announcement') {
    const response = await api.post('/notifications/test', { type });
    return response.data;
  }

  // Get notification statistics
  async getNotificationStats() {
    const response = await api.get('/notifications/stats');
    return response.data;
  }

  // Export notifications
  async exportNotifications(format = 'json', options = {}) {
    const queryParams = new URLSearchParams({ format, ...options });
    
    if (format === 'csv') {
      const response = await fetch(`/api/notifications/export?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      return await response.text();
    } else {
      const response = await api.get(`/notifications/export?${queryParams.toString()}`);
      return response.data;
    }
  }

  // Bulk operations
  async bulkMarkAsRead(notificationIds) {
    return this.markAsRead(notificationIds);
  }

  async bulkDelete(notificationIds) {
    const results = await Promise.allSettled(
      notificationIds.map(id => this.deleteNotification(id))
    );
    
    return {
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }

  // Real-time helpers
  subscribeToNotifications(callback) {
    // This would be used with Socket.io context
    // The actual implementation is in the NotificationPanel component
    console.log('Subscribe to notifications:', callback);
  }

  unsubscribeFromNotifications(callback) {
    // This would be used with Socket.io context
    console.log('Unsubscribe from notifications:', callback);
  }
}

// Create and export a singleton instance
export const notificationService = new NotificationService();
export default notificationService;