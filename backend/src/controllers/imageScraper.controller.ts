import { Request, Response } from 'express';
import {
  searchProductImage,
  findAndAssignProductImage,
  bulkFindProductImages,
  getProductsWithoutImagesCount,
  saveProductImage,
  fixBrokenImagePaths,
  getProductImageHistory,
  restoreImageFromHistory,
} from '../services/imageScraper.service';
import * as jobService from '../services/imageScraperJob.service';

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

// ============================================
// BACKGROUND JOB HANDLERS
// ============================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * Create a new background image scraping job
 * POST /api/image-scraper/jobs
 */
export const createBackgroundJob = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { brandId, categoryId, limit = 100 } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Create the job
    const jobId = await jobService.createJob({
      brandId,
      categoryId,
      limit: Math.min(Math.max(1, limit), 500), // Cap at 500
      createdBy: userId,
    });

    // Start the job in the background
    await jobService.startJob(jobId);

    // Get initial status
    const status = await jobService.getJobStatus(jobId);

    res.json({
      success: true,
      data: status,
      message: 'Background job started successfully',
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create background job',
      error: (error as Error).message,
    });
  }
};

/**
 * Get status of a specific job
 * GET /api/image-scraper/jobs/:jobId
 */
export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const status = await jobService.getJobStatus(jobId);

    if (!status) {
      res.status(404).json({
        success: false,
        message: 'Job not found',
      });
      return;
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job status',
      error: (error as Error).message,
    });
  }
};

/**
 * Get list of all jobs
 * GET /api/image-scraper/jobs
 */
export const getJobList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const result = await jobService.getJobList({
      status: status as any,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get job list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job list',
      error: (error as Error).message,
    });
  }
};

/**
 * Get detailed results of a completed job
 * GET /api/image-scraper/jobs/:jobId/results
 */
export const getJobResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const results = await jobService.getJobResults(jobId);

    if (!results) {
      res.status(404).json({
        success: false,
        message: 'Job not found',
      });
      return;
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Get job results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job results',
      error: (error as Error).message,
    });
  }
};

/**
 * Cancel a running or pending job
 * DELETE /api/image-scraper/jobs/:jobId
 */
export const cancelBackgroundJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const cancelled = await jobService.cancelJob(jobId);

    if (cancelled) {
      res.json({
        success: true,
        message: 'Job cancelled successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Could not cancel job. It may have already completed.',
      });
    }
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel job',
      error: (error as Error).message,
    });
  }
};

// ============================================
// IMAGE HISTORY HANDLERS
// ============================================

/**
 * Get image history for a product
 * GET /api/image-scraper/history/:productId
 */
export const getImageHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: 'Product ID is required',
      });
      return;
    }

    const history = await getProductImageHistory(productId);

    res.json({
      success: true,
      data: {
        productId,
        history,
        count: history.length,
      },
    });
  } catch (error) {
    console.error('Get image history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get image history',
      error: (error as Error).message,
    });
  }
};

/**
 * Restore a previous image from history
 * POST /api/image-scraper/history/:productId/restore/:historyId
 */
export const restoreImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productId, historyId } = req.params;
    const userId = req.user?.id;

    if (!productId || !historyId) {
      res.status(400).json({
        success: false,
        message: 'Product ID and History ID are required',
      });
      return;
    }

    const result = await restoreImageFromHistory(productId, historyId, userId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          productId,
          restoredImageUrl: result.restoredImageUrl,
        },
        message: 'Image restored successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error,
      });
    }
  } catch (error) {
    console.error('Restore image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore image',
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
  createBackgroundJob,
  getJobStatus,
  getJobList,
  getJobResults,
  cancelBackgroundJob,
  getImageHistory,
  restoreImage,
};
