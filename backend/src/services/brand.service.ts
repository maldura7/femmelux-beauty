import { Brand, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { ApiError } from '../middleware';

// Type for brand with products
type BrandWithProducts = Brand & {
  products?: {
    id: string;
    name: string;
    slug: string;
    price: Prisma.Decimal;
    images: string[];
    quantity: number;
    status: boolean;
  }[];
  _count?: {
    products: number;
  };
};

// Type for paginated response
interface PaginatedProducts {
  products: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: Prisma.Decimal;
    wholesalePrice: Prisma.Decimal;
    sku: string;
    images: string[];
    quantity: number;
    status: boolean;
    category: string | null;
    createdAt: Date;
  }[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Type for cart validation
interface CartItem {
  productId: string;
  quantity: number;
}

interface MinimumOrderError {
  brandId: string;
  brandName: string;
  minimumOrder: number;
  currentAmount: number;
  missingAmount: number;
}

// Create brand input
interface CreateBrandInput {
  name: string;
  logo?: string;
  description?: string;
  minimumOrder: number;
  status?: boolean;
}

// Update brand input
interface UpdateBrandInput {
  name?: string;
  slug?: string;
  logo?: string;
  description?: string;
  minimumOrder?: number;
  status?: boolean;
}

class BrandService {
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
      const existing = await prisma.brand.findUnique({
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
   * Get all brands
   */
  async getAllBrands(includeInactive: boolean = false): Promise<BrandWithProducts[]> {
    const whereClause: Prisma.BrandWhereInput = includeInactive ? {} : { status: true };

    const brands = await prisma.brand.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return brands;
  }

  /**
   * Get brand by ID
   */
  async getBrandById(brandId: string): Promise<BrandWithProducts | null> {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        products: {
          where: { status: true },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
            quantity: true,
            status: true,
          },
          orderBy: { name: 'asc' },
          take: 10,
        },
        _count: {
          select: { products: true },
        },
      },
    });

    return brand;
  }

  /**
   * Get brand by slug
   */
  async getBrandBySlug(slug: string): Promise<BrandWithProducts | null> {
    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        products: {
          where: { status: true },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true,
            quantity: true,
            status: true,
          },
          orderBy: { name: 'asc' },
          take: 10,
        },
        _count: {
          select: { products: true },
        },
      },
    });

    return brand;
  }

  /**
   * Create a new brand
   */
  async createBrand(data: CreateBrandInput): Promise<Brand> {
    const slug = await this.ensureUniqueSlug(this.generateSlug(data.name));

    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        slug,
        logo: data.logo,
        description: data.description,
        minimumOrder: data.minimumOrder,
        status: data.status ?? true,
      },
    });

    return brand;
  }

  /**
   * Update a brand
   */
  async updateBrand(brandId: string, data: UpdateBrandInput): Promise<Brand> {
    // Check if brand exists
    const existingBrand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!existingBrand) {
      throw ApiError.notFound('Brand not found');
    }

    // Generate new slug if name changed
    let slug = data.slug;
    if (data.name && data.name !== existingBrand.name) {
      slug = await this.ensureUniqueSlug(this.generateSlug(data.name), brandId);
    }

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: {
        ...data,
        slug: slug || existingBrand.slug,
      },
    });

    return brand;
  }

  /**
   * Delete a brand and all its associated data
   */
  async deleteBrand(brandId: string, hardDelete: boolean = false): Promise<boolean> {
    const existingBrand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!existingBrand) {
      throw ApiError.notFound('Brand not found');
    }

    if (hardDelete) {
      // Hard delete - cascade delete all products first, then the brand
      // This allows re-importing the brand fresh
      await prisma.$transaction(async (tx) => {
        // Delete all order items that reference this brand's products
        await tx.orderItem.deleteMany({
          where: {
            product: {
              brandId: brandId,
            },
          },
        });

        // Delete all products for this brand
        await tx.product.deleteMany({
          where: { brandId: brandId },
        });

        // Delete the brand
        await tx.brand.delete({
          where: { id: brandId },
        });
      });
    } else {
      // Soft delete - set status to false
      await prisma.brand.update({
        where: { id: brandId },
        data: { status: false },
      });
    }

    return true;
  }

  /**
   * Get products for a brand with pagination
   */
  async getBrandProducts(
    brandId: string,
    page: number = 1,
    limit: number = 20,
    includeInactive: boolean = false
  ): Promise<PaginatedProducts> {
    // Check if brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }

    const skip = (page - 1) * limit;

    const whereClause: Prisma.ProductWhereInput = {
      brandId,
      ...(includeInactive ? {} : { status: true }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          wholesalePrice: true,
          sku: true,
          images: true,
          quantity: true,
          status: true,
          category: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Validate minimum orders for cart items
   */
  async validateMinimumOrders(cartItems: CartItem[]): Promise<MinimumOrderError[]> {
    if (!cartItems || cartItems.length === 0) {
      return [];
    }

    // Get all products with their brands
    const productIds = cartItems.map((item) => item.productId);

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
            minimumOrder: true,
          },
        },
      },
    });

    // Create a map for quick product lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Group cart items by brand and calculate totals
    const brandTotals = new Map<
      string,
      { brand: { id: string; name: string; minimumOrder: Prisma.Decimal }; total: number }
    >();

    for (const item of cartItems) {
      const product = productMap.get(item.productId);

      if (!product) {
        continue; // Skip invalid products
      }

      const brandId = product.brandId;
      const itemTotal = Number(product.wholesalePrice) * item.quantity;

      if (brandTotals.has(brandId)) {
        const existing = brandTotals.get(brandId)!;
        existing.total += itemTotal;
      } else {
        brandTotals.set(brandId, {
          brand: product.brand,
          total: itemTotal,
        });
      }
    }

    // Check minimum order requirements
    const errors: MinimumOrderError[] = [];

    for (const [brandId, { brand, total }] of brandTotals) {
      const minimumOrder = Number(brand.minimumOrder);

      if (total < minimumOrder) {
        errors.push({
          brandId,
          brandName: brand.name,
          minimumOrder,
          currentAmount: Math.round(total * 100) / 100,
          missingAmount: Math.round((minimumOrder - total) * 100) / 100,
        });
      }
    }

    return errors;
  }

  /**
   * Search brands by name
   */
  async searchBrands(query: string, limit: number = 10): Promise<Brand[]> {
    const brands = await prisma.brand.findMany({
      where: {
        status: true,
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return brands;
  }

  /**
   * Get brand statistics
   */
  async getBrandStats(brandId: string): Promise<{
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    totalRevenue: number;
  }> {
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw ApiError.notFound('Brand not found');
    }

    const [totalProducts, activeProducts, orderStats] = await Promise.all([
      prisma.product.count({ where: { brandId } }),
      prisma.product.count({ where: { brandId, status: true } }),
      prisma.orderItem.aggregate({
        where: {
          product: { brandId },
        },
        _sum: {
          subtotal: true,
        },
        _count: true,
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      totalOrders: orderStats._count,
      totalRevenue: Number(orderStats._sum.subtotal || 0),
    };
  }
}

export const brandService = new BrandService();
export default brandService;
