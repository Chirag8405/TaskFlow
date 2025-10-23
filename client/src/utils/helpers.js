import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

// Tailwind CSS class name utility
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Format date for display
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, formatStr);
};

// Format date relative to now (e.g., "2 hours ago")
export const formatRelativeDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return '';
  
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

// Check if date is overdue
export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  
  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  
  if (!isValid(dateObj)) return false;
  
  return dateObj < new Date();
};

// Get days until due
export const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  
  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  
  if (!isValid(dateObj)) return null;
  
  const today = new Date();
  const diffTime = dateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Capitalize first letter of string
export const capitalize = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Generate user initials from name
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '';
  
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

// Generate random color for user avatar
export const getAvatarColor = (name) => {
  if (!name) return '#6366f1';
  
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get contrast text color for background
export const getContrastColor = (backgroundColor) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Sort array of objects by property
export const sortBy = (array, property, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Group array of objects by property
export const groupBy = (array, property) => {
  return array.reduce((groups, item) => {
    const key = item[property];
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
};

// Check if object is empty
export const isEmpty = (obj) => {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  return Object.keys(obj).length === 0;
};

// Format priority badge class
export const getPriorityClass = (priority) => {
  switch (priority) {
    case 'high':
      return 'badge-priority-high';
    case 'medium':
      return 'badge-priority-medium';
    case 'low':
      return 'badge-priority-low';
    default:
      return 'badge-priority-medium';
  }
};

// Format status badge class
export const getStatusClass = (status) => {
  switch (status) {
    case 'todo':
      return 'badge-status-todo';
    case 'inprogress':
      return 'badge-status-inprogress';
    case 'done':
      return 'badge-status-done';
    default:
      return 'badge-status-todo';
  }
};

// Convert status to display name
export const getStatusDisplayName = (status) => {
  switch (status) {
    case 'todo':
      return 'To Do';
    case 'inprogress':
      return 'In Progress';
    case 'done':
      return 'Done';
    default:
      return status;
  }
};