const Joi = require('joi');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

// Generic validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails,
      });
    }

    // Replace the request property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any keys that contain prohibited operators
  mongoSanitize(req);

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          // Remove XSS attempts
          obj[key] = xss(obj[key], {
            whiteList: {}, // No HTML tags allowed
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script'],
          });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
  };

  // Sanitize request body, query, and params
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }

  next();
};

// MongoDB ObjectId validation
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }
    
    next();
  };
};

// File upload validation
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    required = false,
  } = options;

  return (req, res, next) => {
    if (!req.file && required) {
      return res.status(400).json({
        success: false,
        message: 'File is required',
      });
    }

    if (req.file) {
      // Check file size
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File size cannot exceed ${maxSize / (1024 * 1024)}MB`,
        });
      }

      // Check file type
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        });
      }

      // Validate filename
      const filename = req.file.originalname;
      if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filename. Only alphanumeric characters, dots, hyphens, and underscores are allowed',
        });
      }
    }

    next();
  };
};

// Password strength validation
const validatePasswordStrength = (req, res, next) => {
  const { password, newPassword } = req.body;
  const passwordToCheck = newPassword || password;

  if (!passwordToCheck) {
    return next();
  }

  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(passwordToCheck);
  const hasLowerCase = /[a-z]/.test(passwordToCheck);
  const hasNumbers = /\d/.test(passwordToCheck);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordToCheck);

  const issues = [];

  if (passwordToCheck.length < minLength) {
    issues.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    issues.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    issues.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    issues.push('Password must contain at least one number');
  }

  // Check for common weak passwords
  const weakPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
  ];
  
  if (weakPasswords.includes(passwordToCheck.toLowerCase())) {
    issues.push('Password is too common and easily guessable');
  }

  if (issues.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet security requirements',
      errors: issues,
    });
  }

  next();
};

// Email validation middleware
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next();
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
    });
  }

  // Convert to lowercase for consistency
  req.body.email = email.toLowerCase().trim();
  next();
};

// Request size validation
const validateRequestSize = (maxSize = 1024 * 1024) => { // 1MB default
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length'), 10);
    
    if (contentLength && contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: `Request too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
      });
    }
    
    next();
  };
};

// Array validation helper
const validateArray = (fieldName, maxLength = 100, itemValidator = null) => {
  return (req, res, next) => {
    const field = req.body[fieldName];
    
    if (!field) {
      return next();
    }

    if (!Array.isArray(field)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be an array`,
      });
    }

    if (field.length > maxLength) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} cannot contain more than ${maxLength} items`,
      });
    }

    if (itemValidator) {
      for (let i = 0; i < field.length; i++) {
        const { error } = itemValidator.validate(field[i]);
        if (error) {
          return res.status(400).json({
            success: false,
            message: `Invalid item at index ${i} in ${fieldName}: ${error.message}`,
          });
        }
      }
    }

    next();
  };
};

module.exports = {
  validate,
  sanitizeInput,
  validateObjectId,
  validateFileUpload,
  validatePasswordStrength,
  validateEmail,
  validateRequestSize,
  validateArray,
};