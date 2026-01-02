import api, { ApiResponse, getErrorMessage, buildQueryString } from '../api';

// ============================================
// TYPES
// ============================================

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface PriceTier {
  id: string;
  minQuantity: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  shortDescription?: string;
  price: number | null; // null when user cannot see prices
  wholesalePrice?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  images: ProductImage[];
  variants: ProductVariant[];
  priceTiers: PriceTier[];
  brand: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    minimumOrderAmount: number;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Backend product type (what the API actually returns)
interface BackendProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number | null; // null when user cannot see prices
  wholesalePrice: number | null; // null when user cannot see prices
  quantity: number;
  status: boolean;
  category?: string;
  images: string[];
  brand: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    minimumOrder: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Transform backend product to frontend Product type
function transformProduct(backendProduct: BackendProduct): Product {
  // Preserve null for prices when user cannot see them
  const wholesalePrice = backendProduct.wholesalePrice !== null
    ? Number(backendProduct.wholesalePrice)
    : null;
  const retailPrice = backendProduct.price !== null
    ? Number(backendProduct.price)
    : null;

  return {
    id: backendProduct.id,
    name: backendProduct.name,
    slug: backendProduct.slug,
    sku: backendProduct.sku,
    description: backendProduct.description,
    price: wholesalePrice, // Use wholesale price for B2B (null when hidden)
    wholesalePrice: wholesalePrice,
    compareAtPrice: retailPrice, // Retail price as compare price
    stock: backendProduct.quantity || 0,
    lowStockThreshold: 10,
    isActive: backendProduct.status,
    isFeatured: false,
    minOrderQuantity: 1,
    images: (backendProduct.images || []).map((url, index) => ({
      id: `img-${index}`,
      url: url,
      alt: backendProduct.name,
      isPrimary: index === 0,
      sortOrder: index,
    })),
    variants: [],
    priceTiers: [],
    brand: {
      id: backendProduct.brand?.id || '',
      name: backendProduct.brand?.name || '',
      slug: backendProduct.brand?.slug || '',
      logo: backendProduct.brand?.logo,
      minimumOrderAmount: Number(backendProduct.brand?.minimumOrder) || 0,
    },
    category: backendProduct.category ? {
      id: backendProduct.category,
      name: backendProduct.category,
      slug: backendProduct.category.toLowerCase().replace(/\s+/g, '-'),
    } : undefined,
    createdAt: backendProduct.createdAt,
    updatedAt: backendProduct.updatedAt,
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
  brandSlug?: string;
  categoryId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stock';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsResponse {
  data: Product[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

// ============================================
// PRODUCTS API
// ============================================

/**
 * Get all products with filters
 */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
  try {
    // Remove frontend-only filters that backend doesn't support
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { brandSlug, categorySlug, isFeatured, ...backendFilters } = filters;
    const queryString = buildQueryString({ ...backendFilters, isActive: true });
    const response = await api.get<ApiResponse<{ products: BackendProduct[]; pagination?: { total: number; page: number; limit: number; pages: number } }>>(`/products${queryString}`);

    // Handle both response formats: { data: BackendProduct[] } or { data: { products: BackendProduct[] } }
    const productsData = response.data.data;
    const backendProducts: BackendProduct[] = Array.isArray(productsData)
      ? productsData
      : (productsData?.products || []);

    // Transform backend products to frontend format
    const products = backendProducts.map(transformProduct);

    // Extract pagination from response.data.data.pagination (backend format)
    // or fallback to response.data.meta for backwards compatibility
    const paginationData = (productsData as { pagination?: { total: number; page: number; limit: number; pages: number } })?.pagination;
    const meta = paginationData || response.data.meta || {
      page: filters.page || 1,
      limit: filters.limit || 20,
      total: products.length,
      totalPages: 1,
    };

    return {
      data: products,
      pagination: {
        total: meta.total,
        pages: meta.pages || meta.totalPages || 1,
        page: meta.page,
        limit: meta.limit,
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get a single product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  try {
    const response = await api.get<ApiResponse<{ product: BackendProduct }>>(`/products/slug/${slug}`);
    // Handle both response formats
    const productData = response.data.data;
    const backendProduct: BackendProduct = (productData as { product: BackendProduct }).product || productData as unknown as BackendProduct;
    return transformProduct(backendProduct);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string): Promise<Product> {
  try {
    const response = await api.get<ApiResponse<{ product: BackendProduct }>>(`/products/${id}`);
    // Handle both response formats
    const productData = response.data.data;
    const backendProduct: BackendProduct = (productData as { product: BackendProduct }).product || productData as unknown as BackendProduct;
    return transformProduct(backendProduct);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
  try {
    const response = await api.get<ApiResponse<{ products: BackendProduct[] }>>(`/products/featured?limit=${limit}`);
    // Handle both response formats
    const productsData = response.data.data;
    const backendProducts: BackendProduct[] = Array.isArray(productsData)
      ? productsData
      : (productsData?.products || []);
    return backendProducts.map(transformProduct);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get products by brand
 */
export async function getProductsByBrand(
  brandSlug: string,
  filters: Omit<ProductFilters, 'brandSlug'> = {}
): Promise<ProductsResponse> {
  // First, get the brand by slug to get its ID
  // The backend filters by brandId, not brandSlug
  const { getBrandBySlug } = await import('./brands.api');
  const brand = await getBrandBySlug(brandSlug);
  return getProducts({ ...filters, brandId: brand.id });
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  categorySlug: string,
  filters: Omit<ProductFilters, 'categorySlug'> = {}
): Promise<ProductsResponse> {
  return getProducts({ ...filters, categorySlug });
}

/**
 * Get related products
 */
export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
  try {
    const response = await api.get<ApiResponse<{ products: BackendProduct[] }>>(
      `/products/${productId}/related?limit=${limit}`
    );
    // Handle both response formats
    const productsData = response.data.data;
    const backendProducts: BackendProduct[] = Array.isArray(productsData)
      ? productsData
      : (productsData?.products || []);
    return backendProducts.map(transformProduct);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Search products
 */
export async function searchProducts(query: string, limit: number = 10): Promise<Product[]> {
  try {
    const response = await api.get<ApiResponse<{ products: BackendProduct[] }>>(
      `/products/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    // Handle both response formats
    const productsData = response.data.data;
    const backendProducts: BackendProduct[] = Array.isArray(productsData)
      ? productsData
      : (productsData?.products || []);
    return backendProducts.map(transformProduct);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
