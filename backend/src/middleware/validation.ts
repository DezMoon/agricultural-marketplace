// src/middleware/validation.ts - Input validation middleware with TypeScript
import { Request, Response, NextFunction } from 'express';
import { body, query, ValidationChain, validationResult } from 'express-validator';
import { ValidationError } from '@/types/express';

// Error handler for validation results
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors: ValidationError[] = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg
    }));
    
    res.status(400).json({
      error: 'Validation failed',
      details: validationErrors
    });
    return;
  }
  
  next();
};

// User validation rules
export const userValidation = {
  register: [
    body('username')
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    handleValidationErrors
  ] as ValidationChain[],

  login: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    handleValidationErrors
  ] as ValidationChain[],

  forgotPassword: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    handleValidationErrors
  ] as ValidationChain[],

  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    handleValidationErrors
  ] as ValidationChain[]
};

// Produce validation rules
export const produceValidation = {
  create: [
    body('title')
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters')
      .trim(),
    
    body('description')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters')
      .trim(),
    
    body('category')
      .isIn(['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'other'])
      .withMessage('Category must be one of: vegetables, fruits, grains, dairy, meat, other'),
    
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    
    body('unit')
      .isIn(['kg', 'lbs', 'tons', 'pieces', 'liters', 'gallons'])
      .withMessage('Unit must be one of: kg, lbs, tons, pieces, liters, gallons'),
    
    body('price_per_unit')
      .isFloat({ min: 0.01 })
      .withMessage('Price per unit must be a positive number'),
    
    body('location')
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters')
      .trim(),
    
    body('harvest_date')
      .isISO8601()
      .withMessage('Harvest date must be a valid date')
      .toDate(),
    
    handleValidationErrors
  ] as ValidationChain[],

  update: [
    body('title')
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters')
      .trim(),
    
    body('category')
      .optional()
      .isIn(['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'other'])
      .withMessage('Category must be one of: vegetables, fruits, grains, dairy, meat, other'),
    
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    
    body('unit')
      .optional()
      .isIn(['kg', 'lbs', 'tons', 'pieces', 'liters', 'gallons'])
      .withMessage('Unit must be one of: kg, lbs, tons, pieces, liters, gallons'),
    
    body('price_per_unit')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Price per unit must be a positive number'),
    
    body('location')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters')
      .trim(),
    
    body('harvest_date')
      .optional()
      .isISO8601()
      .withMessage('Harvest date must be a valid date')
      .toDate(),
    
    body('status')
      .optional()
      .isIn(['active', 'sold', 'expired'])
      .withMessage('Status must be one of: active, sold, expired'),
    
    handleValidationErrors
  ] as ValidationChain[]
};

// Message validation rules
export const messageValidation = {
  send: [
    body('recipient_id')
      .isInt({ min: 1 })
      .withMessage('Recipient ID must be a positive integer'),
    
    body('content')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message content must be between 1 and 1000 characters')
      .trim(),
    
    body('listing_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Listing ID must be a positive integer'),
    
    handleValidationErrors
  ] as ValidationChain[]
};

// Query validation rules
export const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    
    handleValidationErrors
  ] as ValidationChain[],

  produceSearch: [
    query('category')
      .optional()
      .isIn(['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'other'])
      .withMessage('Category must be one of: vegetables, fruits, grains, dairy, meat, other'),
    
    query('location')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Location must be between 1 and 100 characters')
      .trim(),
    
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a non-negative number')
      .toFloat(),
    
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a non-negative number')
      .toFloat(),
    
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
      .trim(),
    
    handleValidationErrors
  ] as ValidationChain[]
};
