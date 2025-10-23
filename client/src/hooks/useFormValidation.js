import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';

// Custom hook for form validation with enhanced features
export const useFormValidation = (schema, options = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    mode = 'onBlur',
    reValidateMode = 'onChange',
    defaultValues = {},
    ...otherOptions
  } = options;

  const form = useForm({
    resolver: yupResolver(schema),
    mode,
    reValidateMode,
    defaultValues,
    ...otherOptions,
  });

  const { handleSubmit, formState: { errors, isValid, isDirty } } = form;

  // Enhanced submit handler with error handling
  const onSubmit = async (submitFunction) => {
    return handleSubmit(async (data) => {
      try {
        setIsSubmitting(true);
        setSubmitError(null);
        await submitFunction(data);
      } catch (error) {
        console.error('Form submission error:', error);
        
        // Handle different types of errors
        if (error.response?.data?.errors) {
          // Server validation errors
          const serverErrors = error.response.data.errors;
          serverErrors.forEach(({ field, message }) => {
            form.setError(field, { message });
          });
        } else if (error.response?.data?.message) {
          // General server error
          setSubmitError(error.response.data.message);
        } else if (error.message) {
          // Network or other errors
          setSubmitError(error.message);
        } else {
          setSubmitError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  // Helper function to get field error message
  const getFieldError = (fieldName) => {
    const error = errors[fieldName];
    return error?.message || null;
  };

  // Helper function to check if field has error
  const hasFieldError = (fieldName) => {
    return !!errors[fieldName];
  };

  // Helper function to clear all errors
  const clearErrors = () => {
    form.clearErrors();
    setSubmitError(null);
  };

  // Helper function to reset form
  const resetForm = (values) => {
    form.reset(values);
    setSubmitError(null);
  };

  return {
    ...form,
    onSubmit,
    isSubmitting,
    submitError,
    setSubmitError,
    getFieldError,
    hasFieldError,
    clearErrors,
    resetForm,
    isValid,
    isDirty,
  };
};

// Validation utilities
export const validateField = (value, rules) => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
};

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required') => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return null;
  },

  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max, message) => (value) => {
    if (value && value.length > max) {
      return message || `Must be no more than ${max} characters`;
    }
    return null;
  },

  email: (message = 'Please enter a valid email address') => (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message;
    }
    return null;
  },

  pattern: (regex, message) => (value) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },

  numeric: (message = 'Please enter a valid number') => (value) => {
    if (value && isNaN(Number(value))) {
      return message;
    }
    return null;
  },

  positiveNumber: (message = 'Please enter a positive number') => (value) => {
    if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
      return message;
    }
    return null;
  },

  url: (message = 'Please enter a valid URL') => (value) => {
    if (value) {
      try {
        new URL(value);
      } catch {
        return message;
      }
    }
    return null;
  },

  match: (otherField, message) => (value, formValues) => {
    if (value && formValues[otherField] && value !== formValues[otherField]) {
      return message || `Must match ${otherField}`;
    }
    return null;
  },

  dateNotPast: (message = 'Date cannot be in the past') => (value) => {
    if (value && new Date(value) < new Date()) {
      return message;
    }
    return null;
  },

  dateAfter: (afterDate, message) => (value) => {
    if (value && afterDate && new Date(value) <= new Date(afterDate)) {
      return message || `Date must be after ${afterDate}`;
    }
    return null;
  },
};

// Form field wrapper with validation
export const FormField = ({ 
  name, 
  label, 
  type = 'text', 
  register, 
  error, 
  required = false,
  children,
  ...props 
}) => {
  const fieldProps = register(name);
  
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {children ? (
        children({ ...fieldProps, ...props })
      ) : (
        <input
          {...fieldProps}
          type={type}
          id={name}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:border-blue-500'
          }`}
          {...props}
        />
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default useFormValidation;