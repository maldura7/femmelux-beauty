import { Router } from 'express';
import analyticsController from '../controllers/analytics.controller';
import { authenticateToken, authorizeRoles } from '../middleware';

const router = Router();

// ============================================
// ANALYTICS ROUTES
// All routes require authentication and Admin/Vendor role
// ============================================

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard statistics
 * @access  Admin / Vendor
 */
router.get(
  '/dashboard',
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  analyticsController.getDashboardStats
);

/**
 * @route   GET /api/analytics/sales
 * @desc    Get sales over time
 * @access  Admin / Vendor
 */
router.get(
  '/sales',
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  analyticsController.getSalesOverTime
);

/**
 * @route   GET /api/analytics/orders-by-status
 * @desc    Get orders grouped by status
 * @access  Admin / Vendor
 */
router.get(
  '/orders-by-status',
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  analyticsController.getOrdersByStatus
);

/**
 * @route   GET /api/analytics/top-products
 * @desc    Get top selling products
 * @access  Admin / Vendor
 */
router.get(
  '/top-products',
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  analyticsController.getTopProducts
);

export default router;
