import { Router } from 'express';
import authRoutes from './auth.routes';
import brandRoutes from './brand.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import analyticsRoutes from './analytics.routes';
import searchRoutes from './search.routes';
import applicationRoutes from './application.routes';
import userRoutes from './user.routes';
import messageRoutes from './message.routes';
import seedRoutes from './seed.routes';
import { orderController } from '../controllers';
import { authenticateToken, authorizeRoles, validate, paginationRules } from '../middleware';

const router = Router();

// ============================================
// HEALTH CHECK
// ============================================

/**
 * @route   GET /api/health
 * @desc    API health check
 * @access  Public
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'FemmeLux Beauty API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// ============================================
// API ROUTES
// ============================================

// Auth routes
router.use('/auth', authRoutes);

// Brand routes
router.use('/brands', brandRoutes);

// Product routes
router.use('/products', productRoutes);

// Order routes
router.use('/orders', orderRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Search routes
router.use('/search', searchRoutes);

// Application routes (business application submission and management)
router.use('/applications', applicationRoutes);

// User routes (admin only)
router.use('/users', userRoutes);

// Message routes (contact form messages)
router.use('/messages', messageRoutes);

// Seed route (one-time database initialization)
router.use('/seed', seedRoutes);

// ============================================
// NESTED ROUTES
// ============================================

/**
 * @route   GET /api/brands/:brandId/orders
 * @desc    Get orders for a specific brand
 * @access  Vendor (own brand) / Admin
 */
router.get(
  '/brands/:brandId/orders',
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  validate(paginationRules),
  orderController.getBrandOrders
);

export default router;
