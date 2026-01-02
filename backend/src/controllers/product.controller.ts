import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { asyncHandler, ApiError } from '../middleware';
import {
  sanitizeProductsPrices,
  sanitizeProductWithVariants,
} from '../utils/priceHelper';

class ProductController {
  /**
   * Get all products with filters
   * GET /api/products
   * Query params: brandId, category, search, minPrice, maxPrice, inStock, page, limit, sortBy, sortOrder
   */
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      brandId,
      category,
      search,
      minPrice,
      maxPrice,
      inStock,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    // Only admins and vendors can see inactive products
    let statusFilter = true;
    if (status === 'false' || status === 'all') {
      if (!req.user || !['ADMIN', 'VENDOR'].includes(req.user.role)) {
        throw ApiError.forbidden('You do not have permission to view inactive products');
      }
      statusFilter = status === 'false' ? false : undefined as unknown as boolean;
    }

    const filters = {
      brandId: brandId as string,
      category: category as string,
      search: search as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      status: statusFilter,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    // Vendors can only see their brand's products
    if (req.user?.role === 'VENDOR' && req.user.brandId) {
      filters.brandId = req.user.brandId;
    }

    const result = await productService.getAllProducts(filters);

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
      canSeePrices, // Let frontend know if prices are visible
    });
  });

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const product = await productService.getProductById(id);

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Check if inactive product and user has permission
    if (!product.status) {
      if (!req.user || !['ADMIN', 'VENDOR'].includes(req.user.role)) {
        throw ApiError.notFound('Product not found');
      }
      // Vendors can only see their brand's inactive products
      if (req.user.role === 'VENDOR' && req.user.brandId !== product.brandId) {
        throw ApiError.notFound('Product not found');
      }
    }

    // Hide prices if user doesn't have access
    const canSeePrices = req.canSeePrices ?? false;
    const sanitizedProduct = sanitizeProductWithVariants(product, canSeePrices);

    res.status(200).json({
      success: true,
      data: { product: sanitizedProduct },
      canSeePrices,
    });
  });

  /**
   * Get product by slug
   * GET /api/products/slug/:slug
   */
  getBySlug = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { slug } = req.params;

    const product = await productService.getProductBySlug(slug);

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    // Check if inactive product and user has permission
    if (!product.status) {
      if (!req.user || !['ADMIN', 'VENDOR'].includes(req.user.role)) {
        throw ApiError.notFound('Product not found');
      }
      if (req.user.role === 'VENDOR' && req.user.brandId !== product.brandId) {
        throw ApiError.notFound('Product not found');
      }
    }

    // Hide prices if user doesn't have access
    const canSeePrices = req.canSeePrices ?? false;
    const sanitizedProduct = sanitizeProductWithVariants(product, canSeePrices);

    res.status(200).json({
      success: true,
      data: { product: sanitizedProduct },
      canSeePrices,
    });
  });

  /**
   * Create a new product
   * POST /api/products
   * Admin and Vendor only
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      brandId,
      name,
      description,
      costPrice,
      wholesalePrice,
      price,
      sku,
      images,
      quantity,
      lowStockThreshold,
      category,
      status,
    } = req.body;

    // Vendors can only create products for their brand
    if (req.user?.role === 'VENDOR') {
      if (!req.user.brandId) {
        throw ApiError.forbidden('You are not assigned to any brand');
      }
      if (brandId !== req.user.brandId) {
        throw ApiError.forbidden('You can only create products for your assigned brand');
      }
    }

    const product = await productService.createProduct({
      brandId,
      name,
      description,
      costPrice: parseFloat(costPrice) || 0,
      wholesalePrice: parseFloat(wholesalePrice),
      price: parseFloat(price),
      sku,
      images: images || [],
      quantity: parseInt(quantity),
      lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 10,
      category,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product },
    });
  });

  /**
   * Update a product
   * PUT /api/products/:id
   * Admin and Vendor only
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const {
      brandId,
      name,
      slug,
      description,
      costPrice,
      wholesalePrice,
      price,
      sku,
      images,
      quantity,
      lowStockThreshold,
      category,
      status,
    } = req.body;

    // Check if product exists and user has permission
    const existingProduct = await productService.getProductById(id);

    if (!existingProduct) {
      throw ApiError.notFound('Product not found');
    }

    // Vendors can only update their brand's products
    if (req.user?.role === 'VENDOR') {
      if (req.user.brandId !== existingProduct.brandId) {
        throw ApiError.forbidden('You can only update products for your assigned brand');
      }
      // Vendors cannot change the brand of a product
      if (brandId && brandId !== existingProduct.brandId) {
        throw ApiError.forbidden('You cannot change the brand of a product');
      }
    }

    const updateData: {
      brandId?: string;
      name?: string;
      slug?: string;
      description?: string;
      costPrice?: number;
      wholesalePrice?: number;
      price?: number;
      sku?: string;
      images?: string[];
      quantity?: number;
      lowStockThreshold?: number;
      category?: string;
      status?: boolean;
    } = {};

    if (brandId !== undefined) updateData.brandId = brandId;
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (costPrice !== undefined) updateData.costPrice = parseFloat(costPrice);
    if (wholesalePrice !== undefined) updateData.wholesalePrice = parseFloat(wholesalePrice);
    if (price !== undefined) updateData.price = parseFloat(price);
    if (sku !== undefined) updateData.sku = sku;
    if (images !== undefined) updateData.images = images;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(lowStockThreshold);
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;

    const product = await productService.updateProduct(id, updateData);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: { product },
    });
  });

  /**
   * Delete a product
   * DELETE /api/products/:id
   * Admin and Vendor only
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const hardDelete = req.query.hardDelete === 'true';

    // Check if product exists and user has permission
    const existingProduct = await productService.getProductById(id);

    if (!existingProduct) {
      throw ApiError.notFound('Product not found');
    }

    // Vendors can only delete their brand's products
    if (req.user?.role === 'VENDOR') {
      if (req.user.brandId !== existingProduct.brandId) {
        throw ApiError.forbidden('You can only delete products for your assigned brand');
      }
      // Vendors cannot hard delete
      if (hardDelete) {
        throw ApiError.forbidden('Only admins can permanently delete products');
      }
    }

    await productService.deleteProduct(id, hardDelete);

    res.status(200).json({
      success: true,
      message: hardDelete ? 'Product permanently deleted' : 'Product deactivated successfully',
    });
  });

  /**
   * Update product stock
   * PATCH /api/products/:id/stock
   * Admin only
   */
  updateStock = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || typeof quantity !== 'number') {
      throw ApiError.badRequest('Quantity is required and must be a number');
    }

    const product = await productService.updateStock(id, quantity);

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: { product },
    });
  });

  /**
   * Bulk update stock
   * PATCH /api/products/stock/bulk
   * Admin only
   */
  bulkUpdateStock = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw ApiError.badRequest('Items array is required');
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number') {
        throw ApiError.badRequest('Each item must have productId and quantity');
      }
    }

    const result = await productService.bulkUpdateStock(items);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: 'Stock update failed',
        errors: result.errors,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated stock for ${result.updated} products`,
      data: { updated: result.updated },
    });
  });

  /**
   * Get related products
   * GET /api/products/:id/related
   */
  getRelated = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 4;

    const products = await productService.getRelatedProducts(id, limit);

    // Hide prices if user doesn't have access
    const canSeePrices = req.canSeePrices ?? false;
    const sanitizedProducts = sanitizeProductsPrices(products, canSeePrices);

    res.status(200).json({
      success: true,
      data: { products: sanitizedProducts },
      count: products.length,
      canSeePrices,
    });
  });

  /**
   * Get low stock products
   * GET /api/products/low-stock
   * Admin and Vendor only
   */
  getLowStock = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const threshold = parseInt(req.query.threshold as string) || 10;

    let products = await productService.getLowStockProducts(threshold);

    // Vendors can only see their brand's low stock products
    if (req.user?.role === 'VENDOR' && req.user.brandId) {
      products = products.filter((p) => p.brandId === req.user?.brandId);
    }

    res.status(200).json({
      success: true,
      data: { products },
      count: products.length,
    });
  });

  /**
   * Get product categories
   * GET /api/products/categories
   */
  getCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const categories = await productService.getCategories();

    res.status(200).json({
      success: true,
      data: { categories },
      count: categories.length,
    });
  });

  /**
   * Restore a soft-deleted product
   * PATCH /api/products/:id/restore
   * Admin and Vendor only
   */
  restore = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await productService.getProductById(id);

    if (!existingProduct) {
      throw ApiError.notFound('Product not found');
    }

    // Vendors can only restore their brand's products
    if (req.user?.role === 'VENDOR') {
      if (req.user.brandId !== existingProduct.brandId) {
        throw ApiError.forbidden('You can only restore products for your assigned brand');
      }
    }

    const product = await productService.updateProduct(id, { status: true });

    res.status(200).json({
      success: true,
      message: 'Product restored successfully',
      data: { product },
    });
  });

  /**
   * Get inventory list with full pricing info
   * GET /api/products/inventory
   * Admin only
   */
  getInventory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      brandId,
      category,
      search,
      inStock,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    const filters = {
      brandId: brandId as string,
      category: category as string,
      search: search as string,
      inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await productService.getInventory(filters);

    res.status(200).json({
      success: true,
      data: {
        products: result.products,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
          hasNextPage: result.page < result.pages,
          hasPrevPage: result.page > 1,
        },
      },
    });
  });

  /**
   * Bulk update inventory
   * PATCH /api/products/inventory/bulk
   * Admin only
   */
  bulkUpdateInventory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw ApiError.badRequest('Items array is required');
    }

    const result = await productService.bulkUpdateInventory(items);

    // Always return 200 for batch operations - the response body indicates partial success/failure
    // This allows the frontend to properly handle the response and show the updated count
    res.status(200).json({
      success: result.success,
      message: result.success
        ? `Successfully updated ${result.updated} products`
        : `Updated ${result.updated} products with ${result.errors.length} errors`,
      data: { updated: result.updated, errors: result.errors },
    });
  });

  /**
   * Export inventory as JSON (can be converted to CSV on frontend)
   * GET /api/products/inventory/export
   * Admin only
   */
  exportInventory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { brandId } = req.query;

    const products = await productService.getProductsForExport(brandId as string);

    res.status(200).json({
      success: true,
      data: { products },
      count: products.length,
    });
  });
}

export const productController = new ProductController();
export default productController;
