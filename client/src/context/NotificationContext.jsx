import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { addEventListener, removeEventListener, isConnected } = useSocket();

  useEffect(() => {
    if (isConnected) {
      // Listen for task-related notifications
      const handleTaskCreated = (task) => {
        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'New Task Created',
          message: `"${task.title}" was created`,
          timestamp: new Date(),
          projectId: task.project
        });
      };

      const handleTaskUpdated = (task) => {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'Task Updated',
          message: `"${task.title}" was updated`,
          timestamp: new Date(),
          projectId: task.project
        });
      };

      const handleTaskMoved = ({ task, newStatus }) => {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'Task Moved',
          message: `"${task.title}" moved to ${newStatus.replace('-', ' ')}`,
          timestamp: new Date(),
          projectId: task.project
        });
      };

      const handleUserOnline = (userInfo) => {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'User Joined',
          message: `${userInfo.userName} joined the project`,
          timestamp: new Date(),
          autoClose: true
        });
      };

      const handleUserOffline = (userInfo) => {
        addNotification({
          id: Date.now(),
          type: 'info',
          title: 'User Left',
          message: `${userInfo.userName} left the project`,
          timestamp: new Date(),
          autoClose: true
        });
      };

      // Add event listeners
      addEventListener('task-created', handleTaskCreated);
      addEventListener('task-updated', handleTaskUpdated);
      addEventListener('task-moved', handleTaskMoved);
      addEventListener('user-online', handleUserOnline);
      addEventListener('user-offline', handleUserOffline);

      return () => {
        // Cleanup listeners
        removeEventListener('task-created', handleTaskCreated);
        removeEventListener('task-updated', handleTaskUpdated);
        removeEventListener('task-moved', handleTaskMoved);
        removeEventListener('user-online', handleUserOnline);
        removeEventListener('user-offline', handleUserOffline);
      };
    }
  }, [isConnected, addEventListener, removeEventListener]);

  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: notification.id || Date.now(),
      timestamp: notification.timestamp || new Date()
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep max 10 notifications

    // Auto-remove notification after 5 seconds if autoClose is true
    if (notification.autoClose !== false) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    markAsRead,
    getUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;