import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticateToken, optionalAuth, checkPriceAccess } from '../middleware';

const router = Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/search
 * @desc    Search products with filters and relevance ranking
 * @access  Public
 * @query   q - Search query (required, min 2 chars)
 * @query   brandId - Filter by brand
 * @query   categoryId - Filter by category
 * @query   minPrice - Minimum price filter
 * @query   maxPrice - Maximum price filter
 * @query   inStock - Filter in-stock products only (true/false)
 * @query   page - Page number (default: 1)
 * @query   limit - Results per page (default: 20, max: 100)
 * @query   sortBy - Sort order (relevance, price_asc, price_desc, popularity, newest)
 */
router.get('/', optionalAuth, checkPriceAccess, searchController.search);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions for autocomplete
 * @access  Public
 * @query   q - Search query
 * @query   limit - Max suggestions (default: 10)
 */
router.get('/suggestions', searchController.suggestions);

/**
 * @route   GET /api/search/popular
 * @desc    Get popular search queries from last 30 days
 * @access  Public
 * @query   limit - Max results (default: 10)
 */
router.get('/popular', searchController.popularSearches);

/**
 * @route   GET /api/search/did-you-mean
 * @desc    Get spelling suggestion for a query
 * @access  Public
 * @query   q - Search query
 */
router.get('/did-you-mean', searchController.didYouMean);

/**
 * @route   POST /api/search/log-click
 * @desc    Log when user clicks on a search result
 * @access  Public
 * @body    searchLogId - ID from search response
 * @body    productId - Clicked product ID
 */
router.post('/log-click', searchController.logClick);

/**
 * @route   POST /api/search/track-view
 * @desc    Track product view for popularity ranking
 * @access  Public
 * @body    productId - Viewed product ID
 */
router.post('/track-view', searchController.trackView);

// ============================================
// AUTHENTICATED ROUTES
// ============================================

/**
 * @route   GET /api/search/history
 * @desc    Get user's search history
 * @access  Private (requires authentication)
 * @query   limit - Max results (default: 10)
 */
router.get('/history', authenticateToken, searchController.searchHistory);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   POST /api/search/rebuild-index
 * @desc    Rebuild search vectors for all products
 * @access  Admin only
 */
router.post('/rebuild-index', authenticateToken, searchController.rebuildIndex);

export default router;
