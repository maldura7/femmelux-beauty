import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import {
  searchImages,
  assignProductImage,
  bulkAssignImages,
  getStats,
} from '../controllers/imageScraper.controller';

const router = Router();

// ============================================
// IMAGE SCRAPER ROUTES
// All routes require admin authentication
// ============================================

/**
 * @route   POST /api/image-scraper/search
 * @desc    Search for product images (preview without saving)
 * @access  Admin only
 */
router.post('/search', authenticateToken, authorizeRoles('ADMIN'), searchImages);

/**
 * @route   POST /api/image-scraper/assign/:productId
 * @desc    Find and assign image to a single product
 * @access  Admin only
 */
router.post('/assign/:productId', authenticateToken, authorizeRoles('ADMIN'), assignProductImage);

/**
 * @route   POST /api/image-scraper/bulk-assign
 * @desc    Bulk assign images to products without images
 * @access  Admin only
 */
router.post('/bulk-assign', authenticateToken, authorizeRoles('ADMIN'), bulkAssignImages);

/**
 * @route   GET /api/image-scraper/stats
 * @desc    Get count of products without images
 * @access  Admin only
 */
router.get('/stats', authenticateToken, authorizeRoles('ADMIN'), getStats);

export default router;
