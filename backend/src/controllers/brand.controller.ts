import { Request, Response } from 'express';
import { brandService } from '../services/brand.service';
import { asyncHandler, ApiError } from '../middleware';
import { sanitizeProductsPrices } from '../utils/priceHelper';

class BrandController {
  /**
   * Get all brands
   * GET /api/brands
   * Query params: includeInactive (boolean)
   */
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const includeInactive = req.query.includeInactive === 'true';

    // Only admins can see inactive brands
    if (includeInactive && req.user?.role !== 'ADMIN') {
      throw ApiError.forbidden('Only admins can view inactive brands');
    }

    const brands = await brandService.getAllBrands(includeInactive);

    res.status(200).json({
      success: true,
      data: { brands },
      count: brands.length,
    });
  });

  /**
   * Get brand by ID
   * GET /api/brands/:id
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const brand = await brandService.getBrandById(id);

    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }

    // Check if inactive brand and user is not admin
    if (!brand.status && req.user?.role !== 'ADMIN') {
      throw ApiError.notFound('Brand not found');
    }

    res.status(200).json({
      success: true,
      data: { brand },
    });
  });

  /**
   * Get brand by slug
   * GET /api/brands/slug/:slug
   */
  getBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;

    const brand = await brandService.getBrandBySlug(slug);

    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }

    // Check if inactive brand and user is not admin
    if (!brand.status && req.user?.role !== 'ADMIN') {
      throw ApiError.notFound('Brand not found');
    }

    res.status(200).json({
      success: true,
      data: { brand },
    });
  });

  /**
   * Create a new brand
   * POST /api/brands
   * Admin only
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, logo, description, minimumOrder, status } = req.body;

    const brand = await brandService.createBrand({
      name,
      logo,
      description,
      minimumOrder: parseFloat(minimumOrder),
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: { brand },
    });
  });

  /**
   * Update a brand
   * PUT /api/brands/:id
   * Admin only
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, slug, logo, description, minimumOrder, status } = req.body;

    const updateData: {
      name?: string;
      slug?: string;
      logo?: string;
      description?: string;
      minimumOrder?: number;
      status?: boolean;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (logo !== undefined) updateData.logo = logo;
    if (description !== undefined) updateData.description = description;
    if (minimumOrder !== undefined) updateData.minimumOrder = parseFloat(minimumOrder);
    if (status !== undefined) updateData.status = status;

    const brand = await brandService.updateBrand(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Brand updated successfully',
      data: { brand },
    });
  });

  /**
   * Delete a brand
   * DELETE /api/brands/:id
   * Admin only
   * Query params: hardDelete (boolean) - permanently delete instead of soft delete
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const hardDelete = req.query.hardDelete === 'true';

    await brandService.deleteBrand(id, hardDelete);

    res.status(200).json({
      success: true,
      message: hardDelete ? 'Brand permanently deleted' : 'Brand deactivated successfully',
    });
  });

  /**
   * Get products for a brand
   * GET /api/brands/:id/products
   * Query params: page, limit, includeInactive
   */
  getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const includeInactive = req.query.includeInactive === 'true';

    // Only admins and vendors can see inactive products
    if (includeInactive && !['ADMIN', 'VENDOR'].includes(req.user?.role || '')) {
      throw ApiError.forbidden('You do not have permission to view inactive products');
    }

    const result = await brandService.getBrandProducts(id, page, limit, includeInactive);

    // Hide prices if user doesn't have access
    const canSeePrices = req.canSeePrices ?? false;
    const sanitizedProducts = sanitizeProductsPrices(result.products, canSeePrices);

    res.status(200).json({
      success: true,
      data: {
        products: sanitizedProducts,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
          hasNextPage: result.page < result.pages,
          hasPrevPage: result.page > 1,
        },
      },
      canSeePrices,
    });
  });

  /**
   * Validate cart items against minimum order requirements
   * POST /api/brands/validate-cart
   * Body: { items: [{ productId, quantity }] }
   */
  validateCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      throw ApiError.badRequest('Items array is required');
    }

    const errors = await brandService.validateMinimumOrders(items);

    const isValid = errors.length === 0;

    res.status(200).json({
      success: true,
      data: {
        isValid,
        errors: isValid ? [] : errors,
        message: isValid
          ? 'All minimum order requirements are met'
          : 'Some brands do not meet minimum order requirements',
      },
    });
  });

  /**
   * Search brands
   * GET /api/brands/search
   * Query params: q (search query), limit
   */
  search = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const query = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query.trim()) {
      res.status(200).json({
        success: true,
        data: { brands: [] },
        count: 0,
      });
      return;
    }

    const brands = await brandService.searchBrands(query, limit);

    res.status(200).json({
      success: true,
      data: { brands },
      count: brands.length,
    });
  });

  /**
   * Get brand statistics
   * GET /api/brands/:id/stats
   * Admin and Vendor only
   */
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Check if user is admin or vendor for this brand
    if (req.user?.role === 'VENDOR' && req.user.brandId !== id) {
      throw ApiError.forbidden('You can only view stats for your own brand');
    }

    const stats = await brandService.getBrandStats(id);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  });

  /**
   * Restore a soft-deleted brand
   * PATCH /api/brands/:id/restore
   * Admin only
   */
  restore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const brand = await brandService.updateBrand(id, { status: true });

    res.status(200).json({
      success: true,
      message: 'Brand restored successfully',
      data: { brand },
    });
  });
}

export const brandController = new BrandController();
export default brandController;
