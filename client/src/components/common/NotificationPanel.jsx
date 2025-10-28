import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle, Bell } from 'lucide-react';

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const NotificationItem = ({ notification, onRemove, onMarkAsRead }) => {
  const typeColors = {
    success: 'border-green-200 bg-green-50',
    error: 'border-red-200 bg-red-50',
    warning: 'border-yellow-200 bg-yellow-50',
    info: 'border-blue-200 bg-blue-50'
  };

  return (
    <div 
      className={`border rounded-lg p-3 mb-2 shadow-sm ${typeColors[notification.type] || typeColors.info} ${
        !notification.read ? 'ring-2 ring-blue-100' : ''
      }`}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          <NotificationIcon type={notification.type} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 break-words">
              {notification.title}
            </p>
            <p className="text-sm text-gray-600 mt-1 break-words">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(notification.id);
          }}
          className="ml-3 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const NotificationPanel = ({ isOpen, onToggle }) => {
  const { 
    notifications, 
    removeNotification, 
    clearAllNotifications,
    markAsRead,
    getUnreadCount 
  } = useNotifications();

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {getUnreadCount() > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {getUnreadCount()}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {getUnreadCount() > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {getUnreadCount()}
          </span>
        )}
      </button>

      <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] sm:max-w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
              >
                Clear all
              </button>
            )}
          </div>
          {getUnreadCount() > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {getUnreadCount()} unread notification{getUnreadCount() !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto p-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRemove={removeNotification}
                onMarkAsRead={markAsRead}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;