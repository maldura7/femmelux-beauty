import { Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware';
import bulkImageService from '../services/bulkImage.service';

class BulkImageController {
  /**
   * Get count of products without images
   * GET /api/products/images/no-image-count
   */
  getNoImageCount = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { brandId, category } = req.query;

    const count = await bulkImageService.getProductsWithoutImagesCount({
      brandId: brandId as string,
      category: category as string,
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  });

  /**
   * Get products without images for preview
   * GET /api/products/images/no-image
   */
  getProductsWithoutImages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { brandId, category, limit, offset } = req.query;

    const result = await bulkImageService.getProductsWithoutImages({
      brandId: brandId as string,
      category: category as string,
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Bulk assign placeholder images to products without images
   * POST /api/products/images/bulk-assign
   */
  bulkAssignPlaceholders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { brandId, category, limit, dryRun } = req.body;

    const result = await bulkImageService.bulkAssignPlaceholderImages({
      brandId,
      category,
      limit: limit ? parseInt(limit) : undefined,
      dryRun: dryRun === true,
    });

    res.status(200).json({
      success: result.success,
      message: result.success
        ? `Successfully assigned images to ${result.updated} products`
        : `Assigned images to ${result.updated} products with ${result.errors.length} errors`,
      data: {
        totalProcessed: result.totalProcessed,
        updated: result.updated,
        skipped: result.skipped,
        categoryStats: result.categoryStats,
      },
      errors: result.errors.slice(0, 20),
      hasMoreErrors: result.errors.length > 20,
    });
  });

  /**
   * Assign a specific image to a product
   * POST /api/products/images/assign
   */
  assignImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { productId, imageUrl } = req.body;

    if (!productId || !imageUrl) {
      throw ApiError.badRequest('productId and imageUrl are required');
    }

    const result = await bulkImageService.assignImageToProduct(productId, imageUrl);

    if (!result.success) {
      throw ApiError.badRequest(result.error || 'Failed to assign image');
    }

    res.status(200).json({
      success: true,
      message: 'Image assigned successfully',
    });
  });

  /**
   * Bulk assign images from a mapping (CSV import style)
   * POST /api/products/images/bulk-assign-mapping
   */
  bulkAssignFromMapping = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { mappings } = req.body;

    if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
      throw ApiError.badRequest('mappings array is required');
    }

    // Validate mappings
    for (const mapping of mappings) {
      if (!mapping.imageUrl) {
        throw ApiError.badRequest('Each mapping must have an imageUrl');
      }
      if (!mapping.productId && !mapping.sku) {
        throw ApiError.badRequest('Each mapping must have either productId or sku');
      }
    }

    const result = await bulkImageService.bulkAssignImagesFromMapping(mappings);

    res.status(200).json({
      success: result.success,
      message: result.success
        ? `Successfully assigned images to ${result.updated} products`
        : `Assigned images to ${result.updated} products with ${result.errors.length} errors`,
      data: {
        totalProcessed: result.totalProcessed,
        updated: result.updated,
        skipped: result.skipped,
      },
      errors: result.errors.slice(0, 20),
      hasMoreErrors: result.errors.length > 20,
    });
  });

  /**
   * Get available placeholder categories
   * GET /api/products/images/categories
   */
  getPlaceholderCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const categories = await bulkImageService.getPlaceholderCategories();

    res.status(200).json({
      success: true,
      data: { categories },
    });
  });

  /**
   * Clear images from products (for testing/reset)
   * POST /api/products/images/clear
   */
  clearImages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { brandId, category, limit } = req.body;

    const result = await bulkImageService.clearProductImages({
      brandId,
      category,
      limit: limit ? parseInt(limit) : undefined,
    });

    res.status(200).json({
      success: true,
      message: `Cleared images from ${result.cleared} products`,
      data: result,
    });
  });
}

export const bulkImageController = new BulkImageController();
export default bulkImageController;
