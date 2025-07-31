// src/middleware/validation.js - Input validation middleware
const { body, validationResult, param, query } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// User validation rules
const userValidation = {
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
  ],

  login: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    handleValidationErrors
  ],

  forgotPassword: [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    handleValidationErrors
  ],

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
  ]
};

// Produce listing validation rules
const produceValidation = {
  create: [
    body('farmer_name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Farmer name must be between 2 and 100 characters')
      .trim(),
    
    body('produce_type')
      .isIn(['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Meat', 'Poultry', 'Fish', 'Other'])
      .withMessage('Invalid produce type'),
    
    body('quantity')
      .isNumeric()
      .withMessage('Quantity must be a number')
      .isFloat({ min: 0.1 })
      .withMessage('Quantity must be greater than 0'),
    
    body('unit')
      .isIn(['kg', 'lbs', 'tons', 'pieces', 'bunches', 'boxes', 'bags'])
      .withMessage('Invalid unit'),
    
    body('price_per_unit')
      .isNumeric()
      .withMessage('Price must be a number')
      .isFloat({ min: 0.01 })
      .withMessage('Price must be greater than 0'),
    
    body('location')
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters')
      .trim(),
    
    handleValidationErrors
  ],

  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid listing ID'),
    
    body('farmer_name')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Farmer name must be between 2 and 100 characters')
      .trim(),
    
    body('produce_type')
      .optional()
      .isIn(['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Meat', 'Poultry', 'Fish', 'Other'])
      .withMessage('Invalid produce type'),
    
    body('quantity')
      .optional()
      .isNumeric()
      .withMessage('Quantity must be a number')
      .isFloat({ min: 0.1 })
      .withMessage('Quantity must be greater than 0'),
    
    body('unit')
      .optional()
      .isIn(['kg', 'lbs', 'tons', 'pieces', 'bunches', 'boxes', 'bags'])
      .withMessage('Invalid unit'),
    
    body('price_per_unit')
      .optional()
      .isNumeric()
      .withMessage('Price must be a number')
      .isFloat({ min: 0.01 })
      .withMessage('Price must be greater than 0'),
    
    body('location')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters')
      .trim(),
    
    body('description')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters')
      .trim(),
    
    handleValidationErrors
  ],

  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid listing ID'),
    
    handleValidationErrors
  ]
};

// Message validation rules
const messageValidation = {
  send: [
    body('receiver_id')
      .isInt({ min: 1 })
      .withMessage('Invalid receiver ID'),
    
    body('listing_id')
      .isInt({ min: 1 })
      .withMessage('Invalid listing ID'),
    
    body('message_text')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Message must be between 1 and 2000 characters')
      .trim(),
    
    handleValidationErrors
  ],

  markRead: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid message ID'),
    
    handleValidationErrors
  ]
};

// Query validation rules
const queryValidation = {
  listings: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('search')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Search query cannot exceed 100 characters')
      .trim(),
    
    query('produce_type')
      .optional()
      .isIn(['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Meat', 'Poultry', 'Fish', 'Other'])
      .withMessage('Invalid produce type'),
    
    query('location')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters')
      .trim(),
    
    handleValidationErrors
  ]
};

module.exports = {
  userValidation,
  produceValidation,
  messageValidation,
  queryValidation,
  handleValidationErrors
};
