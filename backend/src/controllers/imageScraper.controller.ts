import { Request, Response } from 'express';
import {
  searchProductImage,
  findAndAssignProductImage,
  bulkFindProductImages,
  getProductsWithoutImagesCount,
  saveProductImage,
  fixBrokenImagePaths,
} from '../services/imageScraper.service';

// ============================================
// IMAGE SCRAPER CONTROLLER
// ============================================

/**
 * Search for product images (preview without saving)
 * POST /api/image-scraper/search
 */
export const searchImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, brand, sku, size, category } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Product name is required',
      });
      return;
    }

    const results = await searchProductImage({
      name,
      brand,
      sku,
      size,
      category,
    });

    res.json({
      success: true,
      data: {
        query: { name, brand, sku, size },
        results,
        count: results.length,
      },
    });
  } catch (error) {
    console.error('Image search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search for images',
      error: (error as Error).message,
    });
  }
};

/**
 * Find and assign image to a single product
 * POST /api/image-scraper/assign/:productId
 *
 * Body can contain:
 * - imageUrl: string - A single URL to save
 * - imageUrls: string[] - An array of URLs to try (fallbacks)
 *
 * If neither is provided, searches for images automatically.
 */
export const assignProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { imageUrl, imageUrls } = req.body;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
      return;
    }

    // If imageUrls array is provided, try each one until success
    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      const result = await saveProductImage(productId, imageUrls);

      if (result.success) {
        res.json({
          success: true,
          data: result,
          message: 'Image saved successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error,
          data: result,
        });
      }
      return;
    }

    // If imageUrl is provided, save it directly without searching
    if (imageUrl) {
      const result = await saveProductImage(productId, imageUrl);

      if (result.success) {
        res.json({
          success: true,
          data: result,
          message: 'Image saved successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error,
          data: result,
        });
      }
      return;
    }

    // If no imageUrl provided, search automatically
    const result = await findAndAssignProductImage(productId);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: `Image assigned successfully from ${result.source}`,
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error,
        data: result,
      });
    }
  } catch (error) {
    console.error('Image assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign image',
      error: (error as Error).message,
    });
  }
};

/**
 * Bulk assign images to products without images
 * POST /api/image-scraper/bulk-assign
 */
export const bulkAssignImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, brandId, categoryId } = req.body;

    // Validate limit
    const processLimit = Math.min(Math.max(1, limit), 200); // Max 200 products at once

    console.log(`Starting bulk image assignment for ${processLimit} products...`);

    const result = await bulkFindProductImages({
      limit: processLimit,
      brandId,
      categoryId,
    });

    res.json({
      success: true,
      data: {
        total: result.total,
        success: result.success,
        failed: result.failed,
        successRate: result.total > 0 ? ((result.success / result.total) * 100).toFixed(1) + '%' : '0%',
        results: result.results,
      },
      message: `Processed ${result.total} products: ${result.success} success, ${result.failed} failed`,
    });
  } catch (error) {
    console.error('Bulk image assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk assign images',
      error: (error as Error).message,
    });
  }
};

/**
 * Get count of products without images
 * GET /api/image-scraper/stats
 */
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { brandId } = req.query;

    const count = await getProductsWithoutImagesCount(brandId as string | undefined);

    res.json({
      success: true,
      data: {
        productsWithoutImages: count,
        brandId: brandId || null,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: (error as Error).message,
    });
  }
};

/**
 * Fix broken image paths (local /uploads/ paths that no longer work)
 * POST /api/image-scraper/fix-broken-paths
 */
export const fixBrokenPaths = async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('Starting fix for broken image paths...');

    const result = await fixBrokenImagePaths();

    res.json({
      success: true,
      data: result,
      message: `Fixed ${result.fixed} products with broken local image paths. They can now be re-searched.`,
    });
  } catch (error) {
    console.error('Fix broken paths error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix broken image paths',
      error: (error as Error).message,
    });
  }
};

export default {
  searchImages,
  assignProductImage,
  bulkAssignImages,
  getStats,
  fixBrokenPaths,
};
