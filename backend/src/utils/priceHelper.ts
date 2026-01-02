import { Decimal } from '@prisma/client/runtime/library';

// ============================================
// PRICE HELPER UTILITIES
// ============================================

/**
 * Type for a product with price fields
 * Supports Prisma Decimal, number, string, or null for flexibility
 */
interface ProductWithPrices {
  price?: number | string | Decimal | null;
  wholesalePrice?: number | string | Decimal | null;
  costPrice?: number | string | Decimal | null;
  [key: string]: any;
}

/**
 * Sanitize a single product by hiding price fields if user cannot see prices
 * @param product - The product object to sanitize
 * @param canSeePrices - Whether the user can see prices
 * @returns The product with prices hidden if necessary
 */
export const sanitizeProductPrices = <T extends ProductWithPrices>(
  product: T,
  canSeePrices: boolean
): T => {
  if (canSeePrices) {
    return product;
  }

  // Create a copy and null out price fields
  return {
    ...product,
    price: null,
    wholesalePrice: null,
    costPrice: null, // Also hide cost price for security
  };
};

/**
 * Sanitize an array of products by hiding price fields if user cannot see prices
 * @param products - Array of products to sanitize
 * @param canSeePrices - Whether the user can see prices
 * @returns Array of products with prices hidden if necessary
 */
export const sanitizeProductsPrices = <T extends ProductWithPrices>(
  products: T[],
  canSeePrices: boolean
): T[] => {
  if (canSeePrices) {
    return products;
  }

  return products.map((product) => sanitizeProductPrices(product, canSeePrices));
};

/**
 * Sanitize product variants if they exist
 * @param product - Product with optional variants
 * @param canSeePrices - Whether the user can see prices
 * @returns Product with variants having prices hidden if necessary
 */
export const sanitizeProductWithVariants = <T extends ProductWithPrices & { variants?: ProductWithPrices[] }>(
  product: T,
  canSeePrices: boolean
): T => {
  if (canSeePrices) {
    return product;
  }

  const sanitizedProduct = sanitizeProductPrices(product, canSeePrices);

  if (sanitizedProduct.variants && Array.isArray(sanitizedProduct.variants)) {
    sanitizedProduct.variants = sanitizedProduct.variants.map((variant) =>
      sanitizeProductPrices(variant, canSeePrices)
    );
  }

  return sanitizedProduct;
};

/**
 * Sanitize paginated products response
 * @param response - Paginated response with products array
 * @param canSeePrices - Whether the user can see prices
 * @returns Response with products having prices hidden if necessary
 */
export const sanitizePaginatedProducts = <T extends { products: ProductWithPrices[] }>(
  response: T,
  canSeePrices: boolean
): T => {
  if (canSeePrices) {
    return response;
  }

  return {
    ...response,
    products: sanitizeProductsPrices(response.products, canSeePrices),
  };
};

/**
 * Sanitize search results that may contain products
 * @param results - Search results object
 * @param canSeePrices - Whether the user can see prices
 * @returns Search results with product prices hidden if necessary
 */
export const sanitizeSearchResults = <T extends { products?: ProductWithPrices[] }>(
  results: T,
  canSeePrices: boolean
): T => {
  if (canSeePrices) {
    return results;
  }

  if (results.products && Array.isArray(results.products)) {
    return {
      ...results,
      products: sanitizeProductsPrices(results.products, canSeePrices),
    };
  }

  return results;
};
