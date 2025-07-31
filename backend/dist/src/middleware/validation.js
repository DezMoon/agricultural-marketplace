"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryValidation = exports.messageValidation = exports.produceValidation = exports.userValidation = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
// Error handler for validation results
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const validationErrors = errors.array().map(error => ({
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
exports.handleValidationErrors = handleValidationErrors;
// User validation rules
exports.userValidation = {
    register: [
        (0, express_validator_1.body)('username')
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be between 3 and 30 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        (0, express_validator_1.body)('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        (0, express_validator_1.body)('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
        exports.handleValidationErrors
    ],
    login: [
        (0, express_validator_1.body)('identifier')
            .notEmpty()
            .withMessage('Email or username is required')
            .trim(),
        (0, express_validator_1.body)('password')
            .notEmpty()
            .withMessage('Password is required'),
        exports.handleValidationErrors
    ],
    forgotPassword: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail(),
        exports.handleValidationErrors
    ],
    resetPassword: [
        (0, express_validator_1.body)('token')
            .notEmpty()
            .withMessage('Reset token is required'),
        (0, express_validator_1.body)('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
        exports.handleValidationErrors
    ]
};
// Produce validation rules
exports.produceValidation = {
    create: [
        (0, express_validator_1.body)('title')
            .isLength({ min: 3, max: 100 })
            .withMessage('Title must be between 3 and 100 characters')
            .trim(),
        (0, express_validator_1.body)('description')
            .isLength({ min: 10, max: 1000 })
            .withMessage('Description must be between 10 and 1000 characters')
            .trim(),
        (0, express_validator_1.body)('category')
            .isIn(['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'other'])
            .withMessage('Category must be one of: vegetables, fruits, grains, dairy, meat, other'),
        (0, express_validator_1.body)('quantity')
            .isInt({ min: 1 })
            .withMessage('Quantity must be a positive integer'),
        (0, express_validator_1.body)('unit')
            .isIn(['kg', 'lbs', 'tons', 'pieces', 'liters', 'gallons'])
            .withMessage('Unit must be one of: kg, lbs, tons, pieces, liters, gallons'),
        (0, express_validator_1.body)('price_per_unit')
            .isFloat({ min: 0.01 })
            .withMessage('Price per unit must be a positive number'),
        (0, express_validator_1.body)('location')
            .isLength({ min: 2, max: 100 })
            .withMessage('Location must be between 2 and 100 characters')
            .trim(),
        (0, express_validator_1.body)('harvest_date')
            .isISO8601()
            .withMessage('Harvest date must be a valid date')
            .toDate(),
        exports.handleValidationErrors
    ],
    update: [
        (0, express_validator_1.body)('title')
            .optional()
            .isLength({ min: 3, max: 100 })
            .withMessage('Title must be between 3 and 100 characters')
            .trim(),
        (0, express_validator_1.body)('description')
            .optional()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Description must be between 10 and 1000 characters')
            .trim(),
        (0, express_validator_1.body)('category')
            .optional()
            .isIn(['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'other'])
            .withMessage('Category must be one of: vegetables, fruits, grains, dairy, meat, other'),
        (0, express_validator_1.body)('quantity')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Quantity must be a positive integer'),
        (0, express_validator_1.body)('unit')
            .optional()
            .isIn(['kg', 'lbs', 'tons', 'pieces', 'liters', 'gallons'])
            .withMessage('Unit must be one of: kg, lbs, tons, pieces, liters, gallons'),
        (0, express_validator_1.body)('price_per_unit')
            .optional()
            .isFloat({ min: 0.01 })
            .withMessage('Price per unit must be a positive number'),
        (0, express_validator_1.body)('location')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Location must be between 2 and 100 characters')
            .trim(),
        (0, express_validator_1.body)('harvest_date')
            .optional()
            .isISO8601()
            .withMessage('Harvest date must be a valid date')
            .toDate(),
        (0, express_validator_1.body)('status')
            .optional()
            .isIn(['active', 'sold', 'expired'])
            .withMessage('Status must be one of: active, sold, expired'),
        exports.handleValidationErrors
    ]
};
// Message validation rules
exports.messageValidation = {
    send: [
        (0, express_validator_1.body)('recipient_id')
            .isInt({ min: 1 })
            .withMessage('Recipient ID must be a positive integer'),
        (0, express_validator_1.body)('content')
            .isLength({ min: 1, max: 1000 })
            .withMessage('Message content must be between 1 and 1000 characters')
            .trim(),
        (0, express_validator_1.body)('listing_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Listing ID must be a positive integer'),
        exports.handleValidationErrors
    ]
};
// Query validation rules
exports.queryValidation = {
    pagination: [
        (0, express_validator_1.query)('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer')
            .toInt(),
        (0, express_validator_1.query)('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
            .toInt(),
        exports.handleValidationErrors
    ],
    produceSearch: [
        (0, express_validator_1.query)('category')
            .optional()
            .isIn(['vegetables', 'fruits', 'grains', 'dairy', 'meat', 'other'])
            .withMessage('Category must be one of: vegetables, fruits, grains, dairy, meat, other'),
        (0, express_validator_1.query)('location')
            .optional()
            .isLength({ min: 1, max: 100 })
            .withMessage('Location must be between 1 and 100 characters')
            .trim(),
        (0, express_validator_1.query)('minPrice')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Minimum price must be a non-negative number')
            .toFloat(),
        (0, express_validator_1.query)('maxPrice')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Maximum price must be a non-negative number')
            .toFloat(),
        (0, express_validator_1.query)('search')
            .optional()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search term must be between 1 and 100 characters')
            .trim(),
        exports.handleValidationErrors
    ]
};
//# sourceMappingURL=validation.js.map