import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { authenticateToken, authorizeRoles, validateRequest } from '../middleware';
import { body, query } from 'express-validator';

const router = Router();

// ============================================
// VALIDATION RULES
// ============================================

const createMessageValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[\d\s\-\+\(\)]*$/)
    .withMessage('Invalid phone number format'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required'),
  body('orderNumber')
    .optional({ values: 'falsy' })
    .trim(),
  body('message')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be 10-5000 characters'),
];

const getMessagesValidation = [
  query('status')
    .optional()
    .isIn(['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'])
    .withMessage('Invalid status'),
  query('subject')
    .optional()
    .trim(),
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
    .isIn(['createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  query('search')
    .optional()
    .trim(),
];

const updateStatusValidation = [
  body('status')
    .isIn(['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'])
    .withMessage('Invalid status'),
];

const bulkStatusValidation = [
  body('messageIds')
    .isArray({ min: 1 })
    .withMessage('Message IDs must be a non-empty array'),
  body('status')
    .isIn(['UNREAD', 'READ', 'REPLIED', 'ARCHIVED'])
    .withMessage('Invalid status'),
];

const bulkDeleteValidation = [
  body('messageIds')
    .isArray({ min: 1 })
    .withMessage('Message IDs must be a non-empty array'),
];

const replyValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Reply content must be 1-5000 characters'),
];

// ============================================
// PUBLIC ROUTES
// ============================================

// Create a new contact message (public)
router.post(
  '/',
  ...createMessageValidation,
  validateRequest,
  messageController.create.bind(messageController)
);

// ============================================
// ADMIN ROUTES
// ============================================

// Get message statistics
router.get(
  '/stats',
  authenticateToken,
  authorizeRoles('ADMIN'),
  messageController.getStats.bind(messageController)
);

// Bulk update status
router.patch(
  '/bulk/status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  ...bulkStatusValidation,
  validateRequest,
  messageController.bulkUpdateStatus.bind(messageController)
);

// Bulk delete
router.delete(
  '/bulk',
  authenticateToken,
  authorizeRoles('ADMIN'),
  ...bulkDeleteValidation,
  validateRequest,
  messageController.bulkDelete.bind(messageController)
);

// Get all messages
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  ...getMessagesValidation,
  validateRequest,
  messageController.getAll.bind(messageController)
);

// Get message by ID
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  messageController.getById.bind(messageController)
);

// Update message status
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  ...updateStatusValidation,
  validateRequest,
  messageController.updateStatus.bind(messageController)
);

// Reply to message
router.post(
  '/:id/reply',
  authenticateToken,
  authorizeRoles('ADMIN'),
  ...replyValidation,
  validateRequest,
  messageController.reply.bind(messageController)
);

// Delete message
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  messageController.delete.bind(messageController)
);

export default router;
