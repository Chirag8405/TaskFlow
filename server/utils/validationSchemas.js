const Joi = require('joi');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Name can only contain letters and spaces',
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
      }),
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
      }),
    password: Joi.string()
      .min(6)
      .max(100)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        'string.min': 'Password must be at least 6 characters long',
      }),
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .required(),
    password: Joi.string()
      .required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-Z\s]+$/),
    email: Joi.string()
      .email()
      .lowercase(),
    bio: Joi.string()
      .max(500)
      .allow(''),
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark'),
      notifications: Joi.object({
        email: Joi.boolean(),
        push: Joi.boolean(),
        mentions: Joi.boolean(),
      }),
      timezone: Joi.string(),
    }),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(6)
      .max(100)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      }),
  }),
};

// Project validation schemas
const projectSchemas = {
  create: Joi.object({
    title: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'Project title must be at least 3 characters long',
        'string.max': 'Project title cannot exceed 100 characters',
      }),
    description: Joi.string()
      .max(500)
      .allow(''),
    color: Joi.string()
      .allow(''),
    status: Joi.string()
      .valid('planning', 'active', 'on-hold', 'completed', 'archived')
      .default('planning'),
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .default('medium'),
    startDate: Joi.date()
      .allow('', null),
    endDate: Joi.date()
      .allow('', null)
      .when('startDate', {
        is: Joi.date().required(),
        then: Joi.date().greater(Joi.ref('startDate'))
      }),
    members: Joi.array()
      .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
      .max(50),
  }),

  update: Joi.object({
    title: Joi.string()
      .trim()
      .min(3)
      .max(100),
    description: Joi.string()
      .max(500)
      .allow(''),
    color: Joi.string()
      .allow(''),
    status: Joi.string()
      .valid('planning', 'active', 'on-hold', 'completed', 'archived'),
    priority: Joi.string()
      .valid('low', 'medium', 'high'),
    startDate: Joi.date()
      .allow('', null),
    endDate: Joi.date()
      .allow('', null)
      .when('startDate', {
        is: Joi.date().required(),
        then: Joi.date().greater(Joi.ref('startDate'))
      }),
    members: Joi.array()
      .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
      .max(50),
  }),
};

// Task validation schemas
const taskSchemas = {
  create: Joi.object({
    title: Joi.string()
      .trim()
      .min(3)
      .max(200)
      .required()
      .messages({
        'string.min': 'Task title must be at least 3 characters long',
        'string.max': 'Task title cannot exceed 200 characters',
      }),
    description: Joi.string()
      .max(1000)
      .allow(''),
    status: Joi.string()
      .valid('todo', 'in-progress', 'review', 'completed')
      .default('todo'),
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .default('medium'),
    project: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid project ID',
      }),
    assignedTo: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/),
    dueDate: Joi.date()
      .min('now'),
    estimatedHours: Joi.number()
      .positive()
      .max(1000),
    labels: Joi.array()
      .items(Joi.string().trim().min(1).max(50))
      .max(10),
  }),

  update: Joi.object({
    title: Joi.string()
      .trim()
      .min(3)
      .max(200),
    description: Joi.string()
      .max(1000)
      .allow(''),
    status: Joi.string()
      .valid('todo', 'in-progress', 'review', 'completed'),
    priority: Joi.string()
      .valid('low', 'medium', 'high'),
    assignedTo: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .allow(null),
    dueDate: Joi.date()
      .allow(null),
    estimatedHours: Joi.number()
      .positive()
      .max(1000)
      .allow(null),
    labels: Joi.array()
      .items(Joi.string().trim().min(1).max(50))
      .max(10),
  }),

  move: Joi.object({
    newStatus: Joi.string()
      .valid('todo', 'in-progress', 'review', 'completed')
      .required(),
    newPosition: Joi.number()
      .integer()
      .min(0)
      .optional(),
  }),
};

// Comment validation schemas
const commentSchemas = {
  create: Joi.object({
    content: Joi.string()
      .trim()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Comment cannot be empty',
        'string.max': 'Comment cannot exceed 1000 characters',
      }),
    task: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required(),
  }),
};

// Query validation schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),
    sort: Joi.string()
      .valid('createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name', 'priority', '-priority')
      .default('-createdAt'),
  }),

  search: Joi.object({
    q: Joi.string()
      .trim()
      .min(1)
      .max(100),
    status: Joi.string()
      .valid('todo', 'in-progress', 'review', 'completed', 'active', 'on-hold'),
    priority: Joi.string()
      .valid('low', 'medium', 'high'),
    assignedTo: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/),
    project: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/),
    dateFrom: Joi.date(),
    dateTo: Joi.date()
      .greater(Joi.ref('dateFrom')),
  }),
};

// ID validation
const idSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
    }),
});

module.exports = {
  userSchemas,
  projectSchemas,
  taskSchemas,
  commentSchemas,
  querySchemas,
  idSchema,
};