import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateToken, authorizeRoles } from '../middleware';

const router = Router();

// ============================================
// USER ROUTES (Admin only)
// ============================================

/**
 * @route   GET /api/users
 * @desc    Get all users with filters
 * @access  Admin
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  userController.getAllUsers
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Admin
 */
router.get(
  '/stats',
  authenticateToken,
  authorizeRoles('ADMIN'),
  userController.getUserStats
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  userController.getUserById
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user status (active/inactive)
 * @access  Admin
 */
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRoles('ADMIN'),
  userController.updateUserStatus
);

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Update user role
 * @access  Admin
 */
router.patch(
  '/:id/role',
  authenticateToken,
  authorizeRoles('ADMIN'),
  userController.updateUserRole
);

export default router;
