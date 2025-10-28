import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ToastIcon = ({ type }) => {
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

const ToastNotification = ({ notification, onRemove }) => {
  const typeStyles = {
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800'
  };

  return (
    <div 
      className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${
        typeStyles[notification.type] || typeStyles.info
      } border`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ToastIcon type={notification.type} />
          </div>
          <div className="ml-3 flex-1">
            {notification.title && (
              <p className="text-sm font-medium">
                {notification.title}
              </p>
            )}
            <p className={`text-sm ${notification.title ? 'mt-1' : ''} opacity-90`}>
              {notification.message}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => onRemove(notification.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const ToastContainer = () => {
  const { notifications, removeNotification } = useNotifications();
  
  // Filter notifications that should appear as toasts (temporary ones)
  const toastNotifications = notifications.filter(n => n.isToast);

  if (toastNotifications.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toastNotifications.map((notification) => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;