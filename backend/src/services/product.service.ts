import { Product, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { ApiError } from '../middleware';
import { searchService } from './search.service';
import { clearSearchResultsCache, clearProductNamesCache } from '../utils/searchCache';

/**
 * Filter out local upload paths from product images.
 * Local paths like /uploads/... don't work in production (ephemeral storage).
 * Only keep external URLs (http://, https://).
 */
function sanitizeProductImages(images: string[]): string[] {
  if (!images || !Array.isArray(images)) return [];

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) return images;

  // In production, filter out local paths that don't work
  return images.filter(url =>
    url && (url.startsWith('http://') || url.startsWith('https://'))
  );
}

// Type for product with brand
type ProductWithBrand = Product & {
  brand: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    minimumOrder: Prisma.Decimal;
  };
};

// Type for paginated response
interface PaginatedProducts {
  products: ProductWithBrand[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Filter options
interface ProductFilters {
  brandId?: string;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  status?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Create product input
interface CreateProductInput {
  brandId: string;
  name: string;
  description: string;
  costPrice: number;
  wholesalePrice: number;
  price: number; // Retail price
  sku: string;
  images?: string[];
  quantity: number;
  lowStockThreshold?: number;
  category?: string;
  status?: boolean;
}

// Update product input
interface UpdateProductInput {
  brandId?: string;
  name?: string;
  slug?: string;
  description?: string;
  costPrice?: number;
  wholesalePrice?: number;
  price?: number; // Retail price
  sku?: string;
  images?: string[];
  quantity?: number;
  lowStockThreshold?: number;
  category?: string;
  status?: boolean;
}

// Inventory update item for bulk operations
interface InventoryUpdateItem {
  productId?: string;
  sku?: string;
  quantity?: number;
  costPrice?: number;
  wholesalePrice?: number;
  price?: number;
  lowStockThreshold?: number;
}

// Stock update item
interface StockUpdateItem {
  productId: string;
  quantity: number;
}

class ProductService {
  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Ensure slug is unique by appending number if needed
   */
  private async ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
    let uniqueSlug = slug;
    let counter = 1;

    while (true) {
      const existing = await prisma.product.findUnique({
        where: { slug: uniqueSlug },
      });

      if (!existing || existing.id === excludeId) {
        return uniqueSlug;
      }

      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
  }

  /**
   * Get all products with filters and pagination
   */
  async getAllProducts(filters: ProductFilters = {}): Promise<PaginatedProducts> {
    const {
      brandId,
      category,
      search,
      minPrice,
      maxPrice,
      inStock,
      status = true,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Build where clause
    const whereClause: Prisma.ProductWhereInput = {
      status,
    };

    if (brandId) {
      whereClause.brandId = brandId;
    }

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.price = {};
      if (minPrice !== undefined) {
        whereClause.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        whereClause.price.lte = maxPrice;
      }
    }

    if (inStock !== undefined) {
      whereClause.quantity = inStock ? { gt: 0 } : { equals: 0 };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build order by clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'quantity') {
      orderBy.quantity = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              minimumOrder: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    // Sanitize images to remove broken local paths in production
    const sanitizedProducts = products.map(p => ({
      ...p,
      images: sanitizeProductImages(p.images),
    }));

    return {
      products: sanitizedProducts as ProductWithBrand[],
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<ProductWithBrand | null> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            minimumOrder: true,
          },
        },
      },
    });

    if (!product) return null;

    // Sanitize images to remove broken local paths in production
    return {
      ...product,
      images: sanitizeProductImages(product.images),
    } as ProductWithBrand;
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string): Promise<ProductWithBrand | null> {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            minimumOrder: true,
          },
        },
      },
    });

    if (!product) return null;

    // Sanitize images to remove broken local paths in production
    return {
      ...product,
      images: sanitizeProductImages(product.images),
    } as ProductWithBrand;
  }

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductInput): Promise<ProductWithBrand> {
    // Validate brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: data.brandId },
    });

    if (!brand) {
      throw ApiError.badRequest('Brand not found');
    }

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      throw ApiError.conflict('A product with this SKU already exists');
    }

    // Generate unique slug
    const slug = await this.ensureUniqueSlug(this.generateSlug(data.name));

    // Create product
    const product = await prisma.product.create({
      data: {
        brandId: data.brandId,
        name: data.name,
        slug,
        description: data.description,
        costPrice: data.costPrice,
        wholesalePrice: data.wholesalePrice,
        price: data.price,
        sku: data.sku,
        images: data.images || [],
        quantity: data.quantity,
        lowStockThreshold: data.lowStockThreshold ?? 10,
        category: data.category,
        status: data.status ?? true,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            minimumOrder: true,
          },
        },
      },
    });

    // Update search vector and clear caches
    searchService.updateSearchVector(product.id).catch(console.error);
    clearSearchResultsCache().catch(console.error);
    clearProductNamesCache().catch(console.error);

    return product as ProductWithBrand;
  }

  /**
   * Update a product
   */
  async updateProduct(
    productId: string,
    data: UpdateProductInput
  ): Promise<ProductWithBrand> {
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      throw ApiError.notFound('Product not found');
    }

    // Validate brand if changing
    if (data.brandId && data.brandId !== existingProduct.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: data.brandId },
      });

      if (!brand) {
        throw ApiError.badRequest('Brand not found');
      }
    }

    // Check SKU uniqueness if changing
    if (data.sku && data.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingSku) {
        throw ApiError.conflict('A product with this SKU already exists');
      }
    }

    // Generate new slug if name changed
    let slug = data.slug;
    if (data.name && data.name !== existingProduct.name && !data.slug) {
      slug = await this.ensureUniqueSlug(this.generateSlug(data.name), productId);
    }

    // Build update data
    const updateData: Prisma.ProductUpdateInput = {};

    if (data.brandId !== undefined) updateData.brand = { connect: { id: data.brandId } };
    if (data.name !== undefined) updateData.name = data.name;
    if (slug !== undefined) updateData.slug = slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
    if (data.wholesalePrice !== undefined) updateData.wholesalePrice = data.wholesalePrice;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.status !== undefined) updateData.status = data.status;

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            minimumOrder: true,
          },
        },
      },
    });

    // Update search vector and clear caches
    searchService.updateSearchVector(product.id).catch(console.error);
    clearSearchResultsCache().catch(console.error);
    clearProductNamesCache().catch(console.error);

    return product as ProductWithBrand;
  }

  /**
   * Delete a product (soft delete by default)
   */
  async deleteProduct(productId: string, hardDelete: boolean = false): Promise<boolean> {
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
    });

    if (!existingProduct) {
      throw ApiError.notFound('Product not found');
    }

    if (hardDelete) {
      // Check if product has order items
      if (existingProduct._count.orderItems > 0) {
        throw ApiError.badRequest(
          'Cannot permanently delete product with order history. Use soft delete instead.'
        );
      }

      await prisma.product.delete({
        where: { id: productId },
      });
    } else {
      // Soft delete
      await prisma.product.update({
        where: { id: productId },
        data: { status: false },
      });
    }

    // Clear search caches
    clearSearchResultsCache().catch(console.error);
    clearProductNamesCache().catch(console.error);

    return true;
  }

  /**
   * Update stock for a single product
   */
  async updateStock(
    productId: string,
    quantityChange: number
  ): Promise<ProductWithBrand> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const newQuantity = product.quantity + quantityChange;

    if (newQuantity < 0) {
      throw ApiError.badRequest(
        `Insufficient stock. Current: ${product.quantity}, Requested change: ${quantityChange}`
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            minimumOrder: true,
          },
        },
      },
    });

    return updatedProduct as ProductWithBrand;
  }

  /**
   * Bulk update stock for multiple products
   */
  async bulkUpdateStock(
    items: StockUpdateItem[]
  ): Promise<{ success: boolean; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    // Validate all products exist and have sufficient stock
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Check each item
    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }

      const newQuantity = product.quantity + item.quantity;
      if (newQuantity < 0) {
        errors.push(
          `Insufficient stock for ${product.name}. Current: ${product.quantity}, Change: ${item.quantity}`
        );
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return { success: false, updated: 0, errors };
    }

    // Perform bulk update in transaction
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
        updated++;
      }
    });

    return { success: true, updated, errors: [] };
  }

  /**
   * Get products by IDs
   */
  async getProductsByIds(productIds: string[]): Promise<ProductWithBrand[]> {
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: true,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            minimumOrder: true,
          },
        },
      },
    });

    return products as ProductWithBrand[];
  }

  /**
   * Get related products (same brand or category)
   */
  async getRelatedProducts(
    productId: string,
    limit: number = 4
  ): Promise<ProductWithBrand[]> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return [];
    }

    const products = await prisma.product.findMany({
      where: {
        id: { not: productId },
        status: true,
        OR: [
          { brandId: product.brandId },
          ...(product.category ? [{ category: product.category }] : []),
        ],
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            minimumOrder: true,
          },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return products as ProductWithBrand[];
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 10): Promise<ProductWithBrand[]> {
    const products = await prisma.product.findMany({
      where: {
        status: true,
        quantity: { lte: threshold },
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            minimumOrder: true,
          },
        },
      },
      orderBy: { quantity: 'asc' },
    });

    return products as ProductWithBrand[];
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<string[]> {
    const products = await prisma.product.findMany({
      where: {
        status: true,
        category: { not: null },
      },
      select: { category: true },
      distinct: ['category'],
    });

    return products
      .map((p) => p.category)
      .filter((c): c is string => c !== null);
  }

  /**
   * Get all products for inventory management (includes all status)
   */
  async getInventory(filters: ProductFilters = {}): Promise<PaginatedProducts> {
    const {
      brandId,
      category,
      search,
      inStock,
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc',
    } = filters;

    // Build where clause - include all products regardless of status
    const whereClause: Prisma.ProductWhereInput = {};

    if (brandId) {
      whereClause.brandId = brandId;
    }

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (inStock !== undefined) {
      whereClause.quantity = inStock ? { gt: 0 } : { equals: 0 };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build order by clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'quantity') {
      orderBy.quantity = sortOrder;
    } else if (sortBy === 'sku') {
      orderBy.sku = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute queries
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              minimumOrder: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return {
      products: products as ProductWithBrand[],
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Bulk update inventory for multiple products
   */
  async bulkUpdateInventory(
    items: InventoryUpdateItem[]
  ): Promise<{ success: boolean; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    // Process each item individually (not in a single transaction)
    // This allows partial success - some items can succeed while others fail
    for (const item of items) {
      try {
        let product;

        // Find product by ID or SKU
        if (item.productId) {
          product = await prisma.product.findUnique({
            where: { id: item.productId },
          });
        } else if (item.sku) {
          product = await prisma.product.findUnique({
            where: { sku: item.sku },
          });
        }

        if (!product) {
          errors.push(`Product not found: ${item.productId || item.sku}`);
          continue;
        }

        // Build update data
        const updateData: Prisma.ProductUpdateInput = {};

        if (item.quantity !== undefined) updateData.quantity = item.quantity;
        if (item.costPrice !== undefined) updateData.costPrice = item.costPrice;
        if (item.wholesalePrice !== undefined) updateData.wholesalePrice = item.wholesalePrice;
        if (item.price !== undefined) updateData.price = item.price;
        if (item.lowStockThreshold !== undefined) updateData.lowStockThreshold = item.lowStockThreshold;

        // Only update if there's something to update
        if (Object.keys(updateData).length > 0) {
          // Update product
          await prisma.product.update({
            where: { id: product.id },
            data: updateData,
          });
          updated++;
        }
      } catch (error) {
        const identifier = item.productId || item.sku || 'unknown';
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to update ${identifier}: ${errorMessage}`);
      }
    }

    return { success: errors.length === 0, updated, errors };
  }

  /**
   * Get all products for export (no pagination)
   */
  async getProductsForExport(brandId?: string): Promise<any[]> {
    const whereClause: Prisma.ProductWhereInput = {};

    if (brandId) {
      whereClause.brandId = brandId;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        brand: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Format for export
    return products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      brand: p.brand.name,
      category: p.category || '',
      quantity: p.quantity,
      lowStockThreshold: p.lowStockThreshold,
      costPrice: Number(p.costPrice),
      wholesalePrice: Number(p.wholesalePrice),
      retailPrice: Number(p.price),
      status: p.status ? 'Active' : 'Inactive',
    }));
  }
}

export const productService = new ProductService();
export default productService;
