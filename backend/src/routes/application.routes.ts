import { Router } from 'express';
import { applicationController } from '../controllers/application.controller';
import { authenticateToken, authorizeRoles, validateRequest } from '../middleware';
import { body, query } from 'express-validator';

const router = Router();

// ============================================
// VALIDATION RULES
// ============================================

const submitApplicationValidation = [
  body('applicationType')
    .isIn(['CUSTOMER', 'VENDOR'])
    .withMessage('Application type must be CUSTOMER or VENDOR'),
  body('businessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be 2-100 characters'),
  body('businessType')
    .trim()
    .notEmpty()
    .withMessage('Business type is required'),
  body('taxId')
    .trim()
    .notEmpty()
    .withMessage('Tax ID is required'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),
  body('businessAddress')
    .isObject()
    .withMessage('Business address is required'),
  body('businessAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('businessAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('businessAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('businessAddress.zip')
    .trim()
    .notEmpty()
    .withMessage('ZIP code is required'),
  body('businessWebsite')
    .optional({ values: 'falsy' })
    .trim()
    .isURL()
    .withMessage('Invalid website URL'),
  body('businessYears')
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max: 200 })
    .withMessage('Business years must be a valid number'),
  body('estimatedMonthlyPurchase')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Estimated monthly purchase must be a string'),
  // Vendor-specific validation
  body('brandName')
    .if(body('applicationType').equals('VENDOR'))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand name is required for vendor applications (2-100 characters)'),
  body('productCategories')
    .optional({ values: 'falsy' })
    .isArray()
    .withMessage('Product categories must be an array'),
];

const rejectApplicationValidation = [
  body('reason')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Rejection reason must be at least 10 characters'),
];

const suspendUserValidation = [
  body('reason')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Suspension reason must be at least 10 characters'),
];

const getApplicationsValidation = [
  query('status')
    .optional()
    .isIn(['PENDING', 'APPROVED', 'REJECTED'])
    .withMessage('Invalid status'),
  query('applicationType')
    .optional()
    .isIn(['CUSTOMER', 'VENDOR'])
    .withMessage('Invalid application type'),
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
    .isIn(['submittedAt', 'reviewedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

// ============================================
// PUBLIC ROUTES (Authenticated users)
// ============================================

// Submit a new application
router.post(
  '/',
  authenticateToken,
  ...submitApplicationValidation,
  validateRequest,
  applicationController.submit.bind(applicationController)
);

// Get my applications
router.get(
  '/my',
  authenticateToken,
  applicationController.getMyApplications.bind(applicationController)
);

// Resubmit application (for rejected users)
router.post(
  '/resubmit',
  authenticateToken,
  ...submitApplicationValidation,
  validateRequest,
  applicationController.resubmit.bind(applicationController)
);

// ============================================
// ADMIN ROUTES
// ============================================

// Get pending applications count (for dashboard badge)
router.get(
  '/pending-count',
  authenticateToken,
  authorizeRoles('ADMIN'),
  applicationController.getPendingCount.bind(applicationController)
);

// Get application statistics
router.get(
  '/stats',
  authenticateToken,
  authorizeRoles('ADMIN'),
  applicationController.getStats.bind(applicationController)
);

// Export applications to CSV
router.get(
  '/export',
  authenticateToken,
  authorizeRoles('ADMIN'),
  applicationController.export.bind(applicationController)
);

// Get all applications (admin only)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  ...getApplicationsValidation,
  validateRequest,
  applicationController.getAll.bind(applicationController)
);

// Get application by ID (admin only)
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  applicationController.getById.bind(applicationController)
);

// Approve application (admin only)
router.post(
  '/:id/approve',
  authenticateToken,
  authorizeRoles('ADMIN'),
  applicationController.approve.bind(applicationController)
);

// Reject application (admin only)
router.post(
  '/:id/reject',
  authenticateToken,
  authorizeRoles('ADMIN'),
  ...rejectApplicationValidation,
  validateRequest,
  applicationController.reject.bind(applicationController)
);

// Suspend user (admin only)
router.post(
  '/users/:userId/suspend',
  authenticateToken,
  authorizeRoles('ADMIN'),
  ...suspendUserValidation,
  validateRequest,
  applicationController.suspendUser.bind(applicationController)
);

// Unsuspend user (admin only)
router.post(
  '/users/:userId/unsuspend',
  authenticateToken,
  authorizeRoles('ADMIN'),
  applicationController.unsuspendUser.bind(applicationController)
);

export default router;
