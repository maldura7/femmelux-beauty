import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';

/**
 * Middleware to validate request using express-validator
 * Checks for validation errors and returns 400 if any exist
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};

    errors.array().forEach((error) => {
      if (error.type === 'field') {
        const field = error.path;
        if (!formattedErrors[field]) {
          formattedErrors[field] = [];
        }
        formattedErrors[field].push(error.msg);
      }
    });

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
    return;
  }

  next();
};

/**
 * Wrapper to run validations and then validate request
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    validateRequest(req, res, next);
  };
};

// ============================================
// USER VALIDATION RULES
// ============================================

export const registerUserRules: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),

  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),

  body('taxId')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Tax ID must be between 5 and 20 characters'),
];

export const loginUserRules: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const updateUserRules: ValidationChain[] = [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),

  body('taxId')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Tax ID must be between 5 and 20 characters'),

  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
];

// ============================================
// BRAND VALIDATION RULES
// ============================================

export const createBrandRules: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Brand name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand name must be between 2 and 100 characters'),

  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),

  body('logo')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      // Allow both regular URLs and data URLs (base64 images)
      const urlPattern = /^(https?:\/\/|data:image\/)/;
      if (!urlPattern.test(value)) {
        throw new Error('Logo must be a valid URL or image data');
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('minimumOrder')
    .notEmpty()
    .withMessage('Minimum order is required')
    .isFloat({ min: 0 })
    .withMessage('Minimum order must be a positive number'),

  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
];

export const updateBrandRules: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand name must be between 2 and 100 characters'),

  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),

  body('logo')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      // Allow both regular URLs and data URLs (base64 images)
      const urlPattern = /^(https?:\/\/|data:image\/)/;
      if (!urlPattern.test(value)) {
        throw new Error('Logo must be a valid URL or image data');
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('minimumOrder')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum order must be a positive number'),

  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
];

// ============================================
// PRODUCT VALIDATION RULES
// ============================================

export const createProductRules: ValidationChain[] = [
  body('brandId')
    .notEmpty()
    .withMessage('Brand ID is required')
    .isUUID()
    .withMessage('Brand ID must be a valid UUID'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),

  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),

  body('description')
    .optional()
    .trim(),

  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),

  body('wholesalePrice')
    .notEmpty()
    .withMessage('Wholesale price is required')
    .isFloat({ min: 0 })
    .withMessage('Wholesale price must be a positive number'),

  body('price')
    .notEmpty()
    .withMessage('Retail price is required')
    .isFloat({ min: 0 })
    .withMessage('Retail price must be a positive number'),

  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU must be between 3 and 50 characters'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),

  body('images.*')
    .optional()
    .custom((value) => {
      if (!value) return true;
      // Allow both regular URLs and data URLs (base64 images)
      const urlPattern = /^(https?:\/\/|data:image\/)/;
      if (!urlPattern.test(value)) {
        throw new Error('Each image must be a valid URL or image data');
      }
      return true;
    }),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters'),

  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
];

export const updateProductRules: ValidationChain[] = [
  body('brandId')
    .optional()
    .isUUID()
    .withMessage('Brand ID must be a valid UUID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),

  body('slug')
    .optional()
    .trim()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),

  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),

  body('wholesalePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Wholesale price must be a positive number'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Retail price must be a positive number'),

  body('sku')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('SKU must be between 3 and 50 characters'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),

  body('images.*')
    .optional()
    .custom((value) => {
      if (!value) return true;
      // Allow both regular URLs and data URLs (base64 images)
      const urlPattern = /^(https?:\/\/|data:image\/)/;
      if (!urlPattern.test(value)) {
        throw new Error('Each image must be a valid URL or image data');
      }
      return true;
    }),

  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),

  body('lowStockThreshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock threshold must be a non-negative integer'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters'),

  body('status')
    .optional()
    .isBoolean()
    .withMessage('Status must be a boolean'),
];

// ============================================
// ORDER VALIDATION RULES
// ============================================

export const createOrderRules: ValidationChain[] = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must have at least one item'),

  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),

  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),

  body('shippingAddress')
    .notEmpty()
    .withMessage('Shipping address is required')
    .isObject()
    .withMessage('Shipping address must be an object'),

  body('shippingAddress.street')
    .notEmpty()
    .withMessage('Street is required'),

  body('shippingAddress.city')
    .notEmpty()
    .withMessage('City is required'),

  body('shippingAddress.state')
    .notEmpty()
    .withMessage('State is required'),

  body('shippingAddress.zipCode')
    .notEmpty()
    .withMessage('Zip code is required'),

  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Country is required'),

  body('billingAddress')
    .notEmpty()
    .withMessage('Billing address is required')
    .isObject()
    .withMessage('Billing address must be an object'),

  body('billingAddress.street')
    .notEmpty()
    .withMessage('Billing street is required'),

  body('billingAddress.city')
    .notEmpty()
    .withMessage('Billing city is required'),

  body('billingAddress.state')
    .notEmpty()
    .withMessage('Billing state is required'),

  body('billingAddress.zipCode')
    .notEmpty()
    .withMessage('Billing zip code is required'),

  body('billingAddress.country')
    .notEmpty()
    .withMessage('Billing country is required'),
];

export const updateOrderStatusRules: ValidationChain[] = [
  body('status')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid order status'),

  body('paymentStatus')
    .optional()
    .isIn(['PENDING', 'PAID', 'FAILED'])
    .withMessage('Invalid payment status'),

  body('trackingNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Tracking number cannot exceed 100 characters'),
];

// ============================================
// COMMON VALIDATION RULES
// ============================================

export const uuidParamRule: ValidationChain[] = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID'),
];

export const paginationRules: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Sort field cannot exceed 50 characters'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

export default {
  validateRequest,
  validate,
  registerUserRules,
  loginUserRules,
  updateUserRules,
  createBrandRules,
  updateBrandRules,
  createProductRules,
  updateProductRules,
  createOrderRules,
  updateOrderStatusRules,
  uuidParamRule,
  paginationRules,
};
