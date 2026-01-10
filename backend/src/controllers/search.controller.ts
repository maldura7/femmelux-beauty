import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { searchService, SearchFilters } from '../services/search.service';
import { sanitizeProductsPrices } from '../utils/priceHelper';

/**
 * Filter out local upload paths from product images.
 * Local paths like /uploads/... don't work in production (ephemeral storage).
 * Allow: http/https URLs, data: URLs (base64)
 */
function sanitizeImages(images: string[]): string[] {
  if (!images || !Array.isArray(images)) return [];
  if (process.env.NODE_ENV !== 'production') return images;
  return images.filter(url => url && (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:')
  ));
}

// Extend Request to include user from auth middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    brandId?: string | null;
  };
}

/**
 * Search Controller
 * Handles all search-related HTTP requests
 */
class SearchController {
  /**
   * Search products with filters
   * GET /api/search
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        q,
        brandId,
        categoryId,
        minPrice,
        maxPrice,
        inStock,
        page,
        limit,
        sortBy,
      } = req.query;

      // Validate query
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
        });
        return;
      }

      const filters: SearchFilters = {
        brandId: brandId as string | undefined,
        categoryId: categoryId as string | undefined,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        inStock: inStock === 'true',
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? Math.min(parseInt(limit as string, 10), 100) : 20,
        sortBy: (sortBy as SearchFilters['sortBy']) || 'relevance',
      };

      // Perform search
      const result = await searchService.searchProducts(q.trim(), filters);

      // Log search asynchronously (don't wait)
      const userId = (req as AuthRequest).user?.id;
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('User-Agent');

      searchService
        .logSearch(q.trim(), result.total, userId, ipAddress, userAgent)
        .catch((err) => console.error('Failed to log search:', err));

      // Map products with price handling
      const canSeePrices = req.canSeePrices ?? false;
      const mappedProducts = result.products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        wholesalePrice: Number(p.wholesalePrice),
        sku: p.sku,
        images: sanitizeImages(p.images),
        quantity: p.quantity,
        category: p.category,
        brand: {
          id: p.brand.id,
          name: p.brand.name,
          slug: p.brand.slug,
        },
      }));

      // Hide prices if user doesn't have access
      const sanitizedProducts = sanitizeProductsPrices(mappedProducts, canSeePrices);

      res.json({
        success: true,
        data: {
          products: sanitizedProducts,
          total: result.total,
          page: result.page,
          pages: result.pages,
          query: result.query,
          suggestion: result.suggestion,
        },
        canSeePrices,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get search suggestions for autocomplete
   * GET /api/search/suggestions
   */
  async suggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q, limit } = req.query;

      if (!q || typeof q !== 'string') {
        res.json({
          success: true,
          data: { products: [], brands: [], categories: [] },
        });
        return;
      }

      const suggestions = await searchService.getSearchSuggestions(
        q.trim(),
        limit ? parseInt(limit as string, 10) : 10
      );

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get popular search queries
   * GET /api/search/popular
   */
  async popularSearches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit } = req.query;

      const searches = await searchService.getPopularSearches(
        limit ? parseInt(limit as string, 10) : 10
      );

      res.json({
        success: true,
        data: searches,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's search history
   * GET /api/search/history
   * Requires authentication
   */
  async searchHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { limit } = req.query;

      const history = await searchService.getUserSearchHistory(
        req.user.id,
        limit ? parseInt(limit as string, 10) : 10
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log a product click from search results
   * POST /api/search/log-click
   */
  async logClick(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { searchLogId, productId } = req.body;

      if (!searchLogId || !productId) {
        res.status(400).json({
          success: false,
          message: 'searchLogId and productId are required',
        });
        return;
      }

      await searchService.logProductClick(searchLogId, productId);

      res.json({
        success: true,
        message: 'Click logged successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get "Did you mean" suggestion for a query
   * GET /api/search/did-you-mean
   */
  async didYouMean(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.json({
          success: true,
          data: { suggestion: null },
        });
        return;
      }

      const suggestion = await searchService.getDidYouMean(q.trim());

      res.json({
        success: true,
        data: { suggestion },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Track product view
   * POST /api/search/track-view
   */
  async trackView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.body;

      if (!productId) {
        res.status(400).json({
          success: false,
          message: 'productId is required',
        });
        return;
      }

      await searchService.incrementProductView(productId);

      res.json({
        success: true,
        message: 'View tracked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rebuild search vectors for all products
   * POST /api/search/rebuild-index
   * Admin only
   */
  async rebuildIndex(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Admin access required',
        });
        return;
      }

      const updated = await searchService.rebuildAllSearchVectors();

      res.json({
        success: true,
        message: `Rebuilt search index for ${updated} products`,
        data: { productsUpdated: updated },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
export default searchController;
