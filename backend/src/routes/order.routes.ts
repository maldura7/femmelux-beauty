import { Router } from 'express';
import { orderController } from '../controllers';
import {
  authenticateToken,
  authorizeRoles,
  validate,
  createOrderRules,
  updateOrderStatusRules,
  uuidParamRule,
  paginationRules,
} from '../middleware';

const router = Router();

/**
 * @route   GET /api/orders/my
 * @desc    Get current user's orders
 * @access  Customer only
 */
router.get(
  '/my',
  authenticateToken,
  validate(paginationRules),
  orderController.getMyOrders
);

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 * @access  Admin/Vendor
 */
router.get(
  '/stats',
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  orderController.getStats
);

/**
 * @route   GET /api/orders/number/:orderNumber
 * @desc    Get order by order number
 * @access  Owner/Vendor/Admin
 */
router.get(
  '/number/:orderNumber',
  authenticateToken,
  orderController.getByNumber
);

/**
 * @route   GET /api/orders
 * @desc    Get all orders with filters
 * @access  Admin only
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validate(paginationRules),
  orderController.getAll
);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Owner/Vendor/Admin
 */
router.get(
  '/:id',
  validate(uuidParamRule),
  authenticateToken,
  orderController.getById
);

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Customer or Admin
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('CUSTOMER', 'ADMIN'),
  validate(createOrderRules),
  orderController.create
);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status
 * @access  Vendor/Admin
 */
router.patch(
  '/:id/status',
  validate([...uuidParamRule, ...updateOrderStatusRules]),
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  orderController.updateStatus
);

/**
 * @route   PATCH /api/orders/:id/payment-status
 * @desc    Update payment status
 * @access  Admin only
 */
router.patch(
  '/:id/payment-status',
  validate(uuidParamRule),
  authenticateToken,
  authorizeRoles('ADMIN'),
  orderController.updatePaymentStatus
);

/**
 * @route   PATCH /api/orders/:id/tracking
 * @desc    Add tracking number to order
 * @access  Vendor/Admin
 */
router.patch(
  '/:id/tracking',
  validate(uuidParamRule),
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  orderController.addTracking
);

/**
 * @route   POST /api/orders/:id/cancel
 * @desc    Cancel an order
 * @access  Customer (own order)/Admin
 */
router.post(
  '/:id/cancel',
  validate(uuidParamRule),
  authenticateToken,
  orderController.cancel
);

export default router;
