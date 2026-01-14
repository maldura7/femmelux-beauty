import { Router } from 'express';
import { productController } from '../controllers';
import {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
  validate,
  createProductRules,
  updateProductRules,
  uuidParamRule,
  paginationRules,
  checkPriceAccess,
} from '../middleware';

const router = Router();

/**
 * @route   GET /api/products/categories
 * @desc    Get all product categories
 * @access  Public
 */
router.get(
  '/categories',
  productController.getCategories
);

/**
 * @route   GET /api/products/low-stock
 * @desc    Get low stock products
 * @access  Admin/Vendor
 */
router.get(
  '/low-stock',
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  productController.getLowStock
);

/**
 * @route   PATCH /api/products/stock/bulk
 * @desc    Bulk update product stock
 * @access  Admin only
 */
router.patch(
  '/stock/bulk',
  authenticateToken,
  authorizeRoles('ADMIN'),
  productController.bulkUpdateStock
);

/**
 * @route   GET /api/products/inventory
 * @desc    Get inventory list with full pricing info
 * @access  Admin only
 */
router.get(
  '/inventory',
  authenticateToken,
  authorizeRoles('ADMIN'),
  productController.getInventory
);

/**
 * @route   GET /api/products/inventory/export
 * @desc    Export inventory data
 * @access  Admin only
 */
router.get(
  '/inventory/export',
  authenticateToken,
  authorizeRoles('ADMIN'),
  productController.exportInventory
);

/**
 * @route   PATCH /api/products/inventory/bulk
 * @desc    Bulk update inventory (quantity, prices, etc.)
 * @access  Admin only
 */
router.patch(
  '/inventory/bulk',
  authenticateToken,
  authorizeRoles('ADMIN'),
  productController.bulkUpdateInventory
);

/**
 * @route   POST /api/products/bulk-import
 * @desc    Bulk import products from CSV/spreadsheet data
 * @access  Admin only
 */
router.post(
  '/bulk-import',
  authenticateToken,
  authorizeRoles('ADMIN'),
  productController.bulkImport
);

/**
 * @route   GET /api/products
 * @desc    Get all products with filters
 * @access  Public (admins/vendors can see inactive)
 */
router.get(
  '/',
  validate(paginationRules),
  optionalAuth,
  checkPriceAccess,
  productController.getAll
);

/**
 * @route   GET /api/products/slug/:slug
 * @desc    Get product by slug
 * @access  Public
 */
router.get(
  '/slug/:slug',
  optionalAuth,
  checkPriceAccess,
  productController.getBySlug
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get(
  '/:id',
  validate(uuidParamRule),
  optionalAuth,
  checkPriceAccess,
  productController.getById
);

/**
 * @route   GET /api/products/:id/related
 * @desc    Get related products
 * @access  Public
 */
router.get(
  '/:id/related',
  validate(uuidParamRule),
  optionalAuth,
  checkPriceAccess,
  productController.getRelated
);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin/Vendor (vendor restricted to their brand)
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  validate(createProductRules),
  productController.create
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Admin/Vendor (vendor restricted to their brand)
 */
router.put(
  '/:id',
  validate([...uuidParamRule, ...updateProductRules]),
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  productController.update
);

/**
 * @route   PATCH /api/products/:id/stock
 * @desc    Update product stock
 * @access  Admin only
 */
router.patch(
  '/:id/stock',
  validate(uuidParamRule),
  authenticateToken,
  authorizeRoles('ADMIN'),
  productController.updateStock
);

/**
 * @route   PATCH /api/products/:id/restore
 * @desc    Restore a soft-deleted product
 * @access  Admin/Vendor (vendor restricted to their brand)
 */
router.patch(
  '/:id/restore',
  validate(uuidParamRule),
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  productController.restore
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (soft or hard delete)
 * @access  Admin/Vendor (vendor restricted to their brand, no hard delete)
 */
router.delete(
  '/:id',
  validate(uuidParamRule),
  authenticateToken,
  authorizeRoles('ADMIN', 'VENDOR'),
  productController.delete
);

export default router;
