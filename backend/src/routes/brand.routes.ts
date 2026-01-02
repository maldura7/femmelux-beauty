import { Router } from 'express';
import { brandController } from '../controllers';
import {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
  validate,
  createBrandRules,
  updateBrandRules,
  uuidParamRule,
  paginationRules,
  checkPriceAccess,
} from '../middleware';

const router = Router();

/**
 * @route   GET /api/brands/search
 * @desc    Search brands by name
 * @access  Public
 */
router.get(
  '/search',
  brandController.search
);

/**
 * @route   POST /api/brands/validate-cart
 * @desc    Validate cart items against minimum order requirements
 * @access  Public
 */
router.post(
  '/validate-cart',
  brandController.validateCart
);

/**
 * @route   GET /api/brands
 * @desc    Get all brands
 * @access  Public (admins can see inactive)
 */
router.get(
  '/',
  optionalAuth,
  brandController.getAll
);

/**
 * @route   GET /api/brands/slug/:slug
 * @desc    Get brand by slug
 * @access  Public
 */
router.get(
  '/slug/:slug',
  optionalAuth,
  brandController.getBySlug
);

/**
 * @route   GET /api/brands/:id
 * @desc    Get brand by ID
 * @access  Public
 */
router.get(
  '/:id',
  validate(uuidParamRule),
  optionalAuth,
  brandController.getById
);

/**
 * @route   GET /api/brands/:id/products
 * @desc    Get products for a brand
 * @access  Public (admins/vendors can see inactive)
 */
router.get(
  '/:id/products',
  validate([...uuidParamRule, ...paginationRules]),
  optionalAuth,
  checkPriceAccess,
  brandController.getProducts
);

/**
 * @route   GET /api/brands/:id/stats
 * @desc    Get brand statistics
 * @access  Admin/Vendor (own brand)
 */
router.get(
  '/:id/stats',
  validate(uuidParamRule),
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  brandController.getStats
);

/**
 * @route   POST /api/brands
 * @desc    Create a new brand
 * @access  Admin only
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN'),
  validate(createBrandRules),
  brandController.create
);

/**
 * @route   PUT /api/brands/:id
 * @desc    Update a brand
 * @access  Admin only
 */
router.put(
  '/:id',
  validate([...uuidParamRule, ...updateBrandRules]),
  authenticateToken,
  authorizeRoles('ADMIN'),
  brandController.update
);

/**
 * @route   PATCH /api/brands/:id/restore
 * @desc    Restore a soft-deleted brand
 * @access  Admin only
 */
router.patch(
  '/:id/restore',
  validate(uuidParamRule),
  authenticateToken,
  authorizeRoles('ADMIN'),
  brandController.restore
);

/**
 * @route   DELETE /api/brands/:id
 * @desc    Delete a brand (soft or hard delete)
 * @access  Admin only
 */
router.delete(
  '/:id',
  validate(uuidParamRule),
  authenticateToken,
  authorizeRoles('ADMIN'),
  brandController.delete
);

export default router;
