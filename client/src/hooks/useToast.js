import { useNotifications } from '../context/NotificationContext';

export const useToast = () => {
  const { addNotification } = useNotifications();

  const toast = {
    success: (message, title = '') => {
      addNotification({
        id: Date.now() + Math.random(),
        type: 'success',
        title,
        message,
        timestamp: new Date(),
        isToast: true,
        autoClose: true
      });
    },
    
    error: (message, title = '') => {
      addNotification({
        id: Date.now() + Math.random(),
        type: 'error',
        title,
        message,
        timestamp: new Date(),
        isToast: true,
        autoClose: true
      });
    },
    
    warning: (message, title = '') => {
      addNotification({
        id: Date.now() + Math.random(),
        type: 'warning',
        title,
        message,
        timestamp: new Date(),
        isToast: true,
        autoClose: true
      });
    },
    
    info: (message, title = '') => {
      addNotification({
        id: Date.now() + Math.random(),
        type: 'info',
        title,
        message,
        timestamp: new Date(),
        isToast: true,
        autoClose: true
      });
    }
  };

  return { toast };
};