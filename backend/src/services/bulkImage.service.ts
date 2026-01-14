import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// PLACEHOLDER IMAGE CONFIGURATION
// ============================================

// High-quality placeholder images from Unsplash (free, no API key needed for hotlinking)
// These are generic beauty/cosmetics product images organized by category
const CATEGORY_PLACEHOLDERS: Record<string, string[]> = {
  // Skincare products
  skincare: [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1570194065650-d99fb4a8b1a3?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop',
  ],
  // Makeup products
  makeup: [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1583241800698-e8ab01c85d24?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=500&h=500&fit=crop',
  ],
  // Lipstick/Lips
  lips: [
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1631214540553-ff044a3ff1ea?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1588878120667-1e7a89f1fd4d?w=500&h=500&fit=crop',
  ],
  // Eye makeup
  eyes: [
    'https://images.unsplash.com/photo-1583241801263-68ad5a5a99bb?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1617220379175-68eb4f6e4c15?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=500&h=500&fit=crop',
  ],
  // Hair care
  hair: [
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1519735777090-ec97162dc266?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=500&fit=crop',
  ],
  // Fragrance/Perfume
  fragrance: [
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&h=500&fit=crop',
  ],
  // Nail products
  nails: [
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1519014816548-bf5fe0590dfa?w=500&h=500&fit=crop',
  ],
  // Body care
  body: [
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1556228994-81d7d90eb99e?w=500&h=500&fit=crop',
  ],
  // Bath products
  bath: [
    'https://images.unsplash.com/photo-1570194065650-d99fb4a8b1a3?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop',
  ],
  // Face products
  face: [
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1570194065650-d99fb4a8b1a3?w=500&h=500&fit=crop',
  ],
  // Default/Generic beauty products
  default: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop',
    'https://images.unsplash.com/photo-1570194065650-d99fb4a8b1a3?w=500&h=500&fit=crop',
  ],
};

// Category keyword mapping for smart detection
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  skincare: ['serum', 'moisturizer', 'cream', 'lotion', 'cleanser', 'toner', 'sunscreen', 'spf', 'retinol', 'vitamin c', 'hyaluronic'],
  makeup: ['foundation', 'concealer', 'powder', 'blush', 'bronzer', 'highlighter', 'contour', 'primer', 'setting'],
  lips: ['lipstick', 'lip gloss', 'lip liner', 'lip balm', 'lip stain', 'lip oil', 'lip'],
  eyes: ['eyeshadow', 'mascara', 'eyeliner', 'eye liner', 'brow', 'lash', 'eye'],
  hair: ['shampoo', 'conditioner', 'hair oil', 'hair mask', 'hair spray', 'hair serum', 'hair'],
  fragrance: ['perfume', 'eau de', 'cologne', 'fragrance', 'scent', 'mist'],
  nails: ['nail polish', 'nail', 'manicure', 'lacquer'],
  body: ['body lotion', 'body cream', 'body oil', 'body wash', 'body butter', 'body'],
  bath: ['bath bomb', 'bath salt', 'bubble bath', 'shower gel', 'soap', 'bath'],
  face: ['face mask', 'facial', 'face wash', 'face oil', 'face mist'],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Detect category from product name and existing category
 */
function detectCategory(productName: string, existingCategory?: string | null): string {
  const name = productName.toLowerCase();
  const category = existingCategory?.toLowerCase() || '';

  // First check existing category
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => category.includes(kw))) {
      return cat;
    }
  }

  // Then check product name
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => name.includes(kw))) {
      return cat;
    }
  }

  return 'default';
}

/**
 * Get a placeholder image URL for a category
 * Uses consistent selection based on product ID to avoid same image for all products
 */
function getPlaceholderImage(category: string, productId: string): string {
  const images = CATEGORY_PLACEHOLDERS[category] || CATEGORY_PLACEHOLDERS.default;

  // Use product ID hash to consistently select an image
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = ((hash << 5) - hash) + productId.charCodeAt(i);
    hash = hash & hash;
  }

  const index = Math.abs(hash) % images.length;
  return images[index];
}

// ============================================
// MAIN SERVICE FUNCTIONS
// ============================================

interface BulkImageAssignResult {
  success: boolean;
  totalProcessed: number;
  updated: number;
  skipped: number;
  errors: string[];
  categoryStats: Record<string, number>;
}

/**
 * Get count of products without images
 */
export async function getProductsWithoutImagesCount(filters?: {
  brandId?: string;
  category?: string;
}): Promise<number> {
  const whereClause: Record<string, unknown> = {
    OR: [
      { images: { equals: [] } },
      { images: { equals: null } },
    ],
    status: true,
  };

  if (filters?.brandId) {
    whereClause.brandId = filters.brandId;
  }

  if (filters?.category) {
    whereClause.category = filters.category;
  }

  return prisma.product.count({ where: whereClause });
}

/**
 * Get products without images for preview
 */
export async function getProductsWithoutImages(options: {
  limit?: number;
  offset?: number;
  brandId?: string;
  category?: string;
}): Promise<{
  products: Array<{
    id: string;
    name: string;
    category: string | null;
    brandName: string;
    suggestedImage: string;
  }>;
  total: number;
}> {
  const { limit = 100, offset = 0, brandId, category } = options;

  const whereClause: Record<string, unknown> = {
    OR: [
      { images: { equals: [] } },
      { images: { equals: null } },
    ],
    status: true,
  };

  if (brandId) {
    whereClause.brandId = brandId;
  }

  if (category) {
    whereClause.category = category;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: {
        brand: {
          select: { name: true },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' },
    }),
    prisma.product.count({ where: whereClause }),
  ]);

  return {
    products: products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      brandName: p.brand.name,
      suggestedImage: getPlaceholderImage(
        detectCategory(p.name, p.category),
        p.id
      ),
    })),
    total,
  };
}

/**
 * Bulk assign placeholder images to products without images
 * This is the FAST method - assigns placeholder images in bulk using database batch updates
 */
export async function bulkAssignPlaceholderImages(options: {
  brandId?: string;
  category?: string;
  limit?: number;
  dryRun?: boolean;
}): Promise<BulkImageAssignResult> {
  const { brandId, category, limit, dryRun = false } = options;

  const errors: string[] = [];
  const categoryStats: Record<string, number> = {};
  let updated = 0;
  let skipped = 0;

  // Build where clause for products without images
  const whereClause: Record<string, unknown> = {
    OR: [
      { images: { equals: [] } },
      { images: { equals: null } },
    ],
    status: true,
  };

  if (brandId) {
    whereClause.brandId = brandId;
  }

  if (category) {
    whereClause.category = category;
  }

  // Get products without images
  const products = await prisma.product.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      category: true,
    },
    take: limit,
    orderBy: { createdAt: 'asc' },
  });

  if (dryRun) {
    // Just return what would be updated
    for (const product of products) {
      const detectedCategory = detectCategory(product.name, product.category);
      categoryStats[detectedCategory] = (categoryStats[detectedCategory] || 0) + 1;
    }

    return {
      success: true,
      totalProcessed: products.length,
      updated: 0,
      skipped: 0,
      errors: [],
      categoryStats,
    };
  }

  // Process in batches of 100 for efficiency
  const BATCH_SIZE = 100;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    try {
      // Use a transaction for each batch
      await prisma.$transaction(
        batch.map(product => {
          const detectedCategory = detectCategory(product.name, product.category);
          const imageUrl = getPlaceholderImage(detectedCategory, product.id);

          categoryStats[detectedCategory] = (categoryStats[detectedCategory] || 0) + 1;

          return prisma.product.update({
            where: { id: product.id },
            data: { images: [imageUrl] },
          });
        })
      );

      updated += batch.length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${errorMessage}`);
      skipped += batch.length;
    }
  }

  return {
    success: errors.length === 0,
    totalProcessed: products.length,
    updated,
    skipped,
    errors,
    categoryStats,
  };
}

/**
 * Assign a specific image URL to a product
 */
export async function assignImageToProduct(
  productId: string,
  imageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { images: [imageUrl] },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Assign images from a CSV/list mapping (productId/SKU -> imageUrl)
 */
export async function bulkAssignImagesFromMapping(
  mappings: Array<{
    productId?: string;
    sku?: string;
    imageUrl: string;
  }>
): Promise<BulkImageAssignResult> {
  const errors: string[] = [];
  let updated = 0;
  let skipped = 0;

  for (const mapping of mappings) {
    try {
      let product;

      if (mapping.productId) {
        product = await prisma.product.findUnique({
          where: { id: mapping.productId },
          select: { id: true },
        });
      } else if (mapping.sku) {
        product = await prisma.product.findUnique({
          where: { sku: mapping.sku },
          select: { id: true },
        });
      }

      if (!product) {
        errors.push(`Product not found: ${mapping.productId || mapping.sku}`);
        skipped++;
        continue;
      }

      await prisma.product.update({
        where: { id: product.id },
        data: { images: [mapping.imageUrl] },
      });

      updated++;
    } catch (error) {
      const identifier = mapping.productId || mapping.sku || 'unknown';
      errors.push(`Failed to update ${identifier}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      skipped++;
    }
  }

  return {
    success: errors.length === 0,
    totalProcessed: mappings.length,
    updated,
    skipped,
    errors,
    categoryStats: {},
  };
}

/**
 * Get available placeholder categories with counts
 */
export async function getPlaceholderCategories(): Promise<Array<{
  category: string;
  sampleImage: string;
  imageCount: number;
}>> {
  return Object.entries(CATEGORY_PLACEHOLDERS).map(([category, images]) => ({
    category,
    sampleImage: images[0],
    imageCount: images.length,
  }));
}

/**
 * Clear all images from products (useful for testing or reset)
 */
export async function clearProductImages(options: {
  brandId?: string;
  category?: string;
  limit?: number;
}): Promise<{ cleared: number }> {
  const { brandId, category, limit } = options;

  const whereClause: Record<string, unknown> = {};

  if (brandId) {
    whereClause.brandId = brandId;
  }

  if (category) {
    whereClause.category = category;
  }

  // Get product IDs to clear - find products that have images (non-empty array)
  // We'll fetch all and filter in JS since Prisma array filtering is tricky
  const products = await prisma.product.findMany({
    where: whereClause,
    select: { id: true, images: true },
    take: limit ? limit * 2 : undefined, // Fetch extra since we'll filter
  });

  // Filter to only products with images
  const productsWithImages = products.filter(p =>
    p.images && Array.isArray(p.images) && p.images.length > 0
  ).slice(0, limit);

  if (productsWithImages.length === 0) {
    return { cleared: 0 };
  }

  // Clear images
  await prisma.product.updateMany({
    where: {
      id: { in: productsWithImages.map(p => p.id) },
    },
    data: { images: [] },
  });

  return { cleared: productsWithImages.length };
}

export default {
  getProductsWithoutImagesCount,
  getProductsWithoutImages,
  bulkAssignPlaceholderImages,
  assignImageToProduct,
  bulkAssignImagesFromMapping,
  getPlaceholderCategories,
  clearProductImages,
};
