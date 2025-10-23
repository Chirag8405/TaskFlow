import * as yup from 'yup';

// Auth validation schemas
export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export const registerSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

// Project validation schemas
export const projectSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters')
    .required('Project name is required'),
  description: yup
    .string()
    .trim()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  status: yup
    .string()
    .oneOf(['active', 'completed', 'on-hold'], 'Invalid project status')
    .required('Project status is required'),
  startDate: yup
    .date()
    .min(new Date(), 'Start date cannot be in the past')
    .optional(),
  endDate: yup
    .date()
    .min(yup.ref('startDate'), 'End date must be after start date')
    .optional(),
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high'], 'Invalid priority level')
    .default('medium'),
});

// Task validation schemas
export const taskSchema = yup.object({
  title: yup
    .string()
    .trim()
    .min(3, 'Task title must be at least 3 characters')
    .max(200, 'Task title must be less than 200 characters')
    .required('Task title is required'),
  description: yup
    .string()
    .trim()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  status: yup
    .string()
    .oneOf(['todo', 'in-progress', 'review', 'completed'], 'Invalid task status')
    .default('todo'),
  priority: yup
    .string()
    .oneOf(['low', 'medium', 'high'], 'Invalid priority level')
    .default('medium'),
  dueDate: yup
    .date()
    .min(new Date(), 'Due date cannot be in the past')
    .optional(),
  estimatedHours: yup
    .number()
    .positive('Estimated hours must be positive')
    .max(1000, 'Estimated hours cannot exceed 1000')
    .optional(),
  assignedTo: yup
    .string()
    .optional(),
  labels: yup
    .array()
    .of(yup.string().trim().min(1).max(50))
    .max(10, 'Cannot have more than 10 labels')
    .optional(),
});

// User profile validation schemas
export const profileSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  bio: yup
    .string()
    .trim()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  currentPassword: yup
    .string()
    .when('newPassword', {
      is: (val) => val && val.length > 0,
      then: (schema) => schema.required('Current password is required to change password'),
    }),
  newPassword: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .optional(),
  confirmNewPassword: yup
    .string()
    .when('newPassword', {
      is: (val) => val && val.length > 0,
      then: (schema) => schema
        .oneOf([yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm your new password'),
    }),
});

// Team member validation
export const teamMemberSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  role: yup
    .string()
    .oneOf(['admin', 'member', 'viewer'], 'Invalid role')
    .default('member'),
});

// Comment validation
export const commentSchema = yup.object({
  content: yup
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters')
    .required('Comment is required'),
});

// Search validation
export const searchSchema = yup.object({
  query: yup
    .string()
    .trim()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query must be less than 100 characters'),
  filters: yup.object({
    status: yup.string().optional(),
    priority: yup.string().optional(),
    assignedTo: yup.string().optional(),
    project: yup.string().optional(),
    dateRange: yup.object({
      start: yup.date().optional(),
      end: yup.date().min(yup.ref('start'), 'End date must be after start date').optional(),
    }).optional(),
  }).optional(),
});

export default {
  loginSchema,
  registerSchema,
  projectSchema,
  taskSchema,
  profileSchema,
  teamMemberSchema,
  commentSchema,
  searchSchema,
};