const { body, validationResult } = require('express-validator');

exports.validateUserRegistration = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2 })
        .withMessage('Name must be at least 2 characters long'),
    
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    
    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    
    body('role')
        .trim()
        .notEmpty()
        .withMessage('Role is required')
        .isIn(['admin', 'godown_manager', 'pds_shop_owner', 'delivery_personnel', 'beneficiary'])
        .withMessage('Invalid role specified'),
    
    body('contactnumber')
        .trim()
        .notEmpty()
        .withMessage('Contact number is required')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Please provide a valid contact number'),
    
    body('address')
        .trim()
        .notEmpty()
        .withMessage('Address is required'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                errors: errors.array()
            });
        }
        next();
    }
];