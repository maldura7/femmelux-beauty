import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import {
  searchImages,
  assignProductImage,
  bulkAssignImages,
  getStats,
  fixBrokenPaths,
  // Background job handlers
  createBackgroundJob,
  getJobStatus,
  getJobList,
  cancelBackgroundJob,
  getJobResults,
  // Image history handlers
  getImageHistory,
  restoreImage,
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

/**
 * @route   POST /api/image-scraper/fix-broken-paths
 * @desc    Fix products with broken local image paths (clears them for re-search)
 * @access  Admin only
 */
router.post('/fix-broken-paths', authenticateToken, authorizeRoles('ADMIN'), fixBrokenPaths);

// ============================================
// BACKGROUND JOB ROUTES
// ============================================

/**
 * @route   POST /api/image-scraper/jobs
 * @desc    Create a new background image scraping job
 * @access  Admin only
 */
router.post('/jobs', authenticateToken, authorizeRoles('ADMIN'), createBackgroundJob);

/**
 * @route   GET /api/image-scraper/jobs
 * @desc    List all background jobs
 * @access  Admin only
 */
router.get('/jobs', authenticateToken, authorizeRoles('ADMIN'), getJobList);

/**
 * @route   GET /api/image-scraper/jobs/:jobId
 * @desc    Get status of a specific job
 * @access  Admin only
 */
router.get('/jobs/:jobId', authenticateToken, authorizeRoles('ADMIN'), getJobStatus);

/**
 * @route   GET /api/image-scraper/jobs/:jobId/results
 * @desc    Get detailed results of a completed job
 * @access  Admin only
 */
router.get('/jobs/:jobId/results', authenticateToken, authorizeRoles('ADMIN'), getJobResults);

/**
 * @route   DELETE /api/image-scraper/jobs/:jobId
 * @desc    Cancel a running or pending job
 * @access  Admin only
 */
router.delete('/jobs/:jobId', authenticateToken, authorizeRoles('ADMIN'), cancelBackgroundJob);

// ============================================
// IMAGE HISTORY ROUTES
// ============================================

/**
 * @route   GET /api/image-scraper/history/:productId
 * @desc    Get image history for a product
 * @access  Admin only
 */
router.get('/history/:productId', authenticateToken, authorizeRoles('ADMIN'), getImageHistory);

/**
 * @route   POST /api/image-scraper/history/:productId/restore/:historyId
 * @desc    Restore a previous image from history
 * @access  Admin only
 */
router.post('/history/:productId/restore/:historyId', authenticateToken, authorizeRoles('ADMIN'), restoreImage);

export default router;
