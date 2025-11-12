const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');

// Common validation rules
const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Please provide a valid email address');

const passwordValidation = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be between 8 and 128 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain at least one lowercase letter, uppercase letter, number, and special character');

const nameValidation = (field) => body(field)
  .trim()
  .isLength({ min: 1, max: 100 })
  .withMessage(`${field} must be between 1 and 100 characters`)
  .matches(/^[a-zA-Z\s'-]+$/)
  .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`);

const phoneValidation = body('phone')
  .optional()
  .isMobilePhone('any')
  .withMessage('Please provide a valid phone number');

const coordinateValidation = (field) => body(field)
  .isFloat({ min: -180, max: 180 })
  .withMessage(`${field} must be a valid coordinate`);

const idValidation = (field = 'id') => param(field)
  .isUUID()
  .withMessage(`${field} must be a valid UUID`);

const textValidation = (field, maxLength = 1000) => body(field)
  .trim()
  .isLength({ max: maxLength })
  .withMessage(`${field} must be no more than ${maxLength} characters`)
  .escape(); // Prevent XSS

const categoryValidation = body('category')
  .isIn(['pothole', 'streetlight', 'garbage', 'water', 'traffic', 'other'])
  .withMessage('Category must be one of: pothole, streetlight, garbage, water, traffic, other');

const statusValidation = body('status')
  .optional()
  .isIn(['pending', 'in-progress', 'resolved', 'rejected'])
  .withMessage('Status must be one of: pending, in-progress, resolved, rejected');

const priorityValidation = body('priority')
  .optional()
  .isIn(['low', 'medium', 'high', 'critical'])
  .withMessage('Priority must be one of: low, medium, high, critical');

// Pagination validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// File validation middleware
const fileValidation = (req, res, next) => {
  if (req.file) {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedMimes.includes(req.file.mimetype)) {
      return next(new AppError('Invalid file type. Only JPEG, PNG, and JPG are allowed.', 400, 'INVALID_FILE_TYPE'));
    }

    if (req.file.size > maxSize) {
      return next(new AppError('File size too large. Maximum size is 5MB.', 400, 'FILE_TOO_LARGE'));
    }
  }
  next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));

    return next(new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      { errors: validationErrors }
    ));
  }
  next();
};

// Specific validation sets
const userValidation = {
  register: [
    emailValidation,
    passwordValidation,
    nameValidation('firstName'),
    nameValidation('lastName'),
    phoneValidation,
    handleValidationErrors,
  ],
  login: [
    emailValidation,
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
  ],
  update: [
    nameValidation('firstName').optional(),
    nameValidation('lastName').optional(),
    phoneValidation,
    handleValidationErrors,
  ],
};

const reportValidation = {
  create: [
    textValidation('title', 200),
    textValidation('description', 2000),
    categoryValidation,
    coordinateValidation('latitude'),
    coordinateValidation('longitude'),
    textValidation('address', 300),
    priorityValidation,
    fileValidation,
    handleValidationErrors,
  ],
  update: [
    idValidation(),
    textValidation('title', 200).optional(),
    textValidation('description', 2000).optional(),
    categoryValidation.optional(),
    statusValidation,
    priorityValidation,
    handleValidationErrors,
  ],
  get: [
    idValidation(),
    handleValidationErrors,
  ],
  list: [
    ...paginationValidation,
    query('category').optional().isIn(['pothole', 'streetlight', 'garbage', 'water', 'traffic', 'other']),
    query('status').optional().isIn(['pending', 'in-progress', 'resolved', 'rejected']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    handleValidationErrors,
  ],
};

const commentValidation = {
  create: [
    idValidation('reportId'),
    textValidation('content', 1000),
    handleValidationErrors,
  ],
  update: [
    idValidation('commentId'),
    textValidation('content', 1000),
    handleValidationErrors,
  ],
};

module.exports = {
  userValidation,
  reportValidation,
  commentValidation,
  fileValidation,
  handleValidationErrors,
  paginationValidation,
};