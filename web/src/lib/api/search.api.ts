import api, { ApiResponse, getErrorMessage } from '../api';
import { Product } from './products.api';

// ============================================
// TYPES
// ============================================

export interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  wholesalePrice: number;
  sku: string;
  images: string[];
  quantity: number;
  category: string | null;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SearchFilters {
  brandId?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'popularity' | 'newest';
}

export interface SearchResults {
  products: SearchProduct[];
  total: number;
  page: number;
  pages: number;
  query: string;
  suggestion?: string | null;
}

export interface ProductSuggestion {
  id: string;
  name: string;
  slug: string;
  images: string[];
  wholesalePrice: number;
  brand?: { name: string };
}

export interface BrandSuggestion {
  id: string;
  name: string;
  slug: string;
}

export interface CategorySuggestion {
  id: string;
  name: string;
  slug: string;
}

export interface Suggestions {
  products: ProductSuggestion[];
  brands: BrandSuggestion[];
  categories: CategorySuggestion[];
}

export interface PopularSearch {
  query: string;
  count: number;
}

export interface SearchHistoryItem {
  query: string;
  createdAt: string;
}

// Transform search product to Product type for compatibility
export function transformSearchProduct(searchProduct: SearchProduct): Product {
  return {
    id: searchProduct.id,
    name: searchProduct.name,
    slug: searchProduct.slug,
    sku: searchProduct.sku,
    description: searchProduct.description,
    price: searchProduct.wholesalePrice,
    wholesalePrice: searchProduct.wholesalePrice,
    compareAtPrice: searchProduct.price,
    stock: searchProduct.quantity,
    lowStockThreshold: 10,
    isActive: true,
    isFeatured: false,
    minOrderQuantity: 1,
    images: (searchProduct.images || []).map((url, index) => ({
      id: `img-${index}`,
      url: url,
      alt: searchProduct.name,
      isPrimary: index === 0,
      sortOrder: index,
    })),
    variants: [],
    priceTiers: [],
    brand: {
      id: searchProduct.brand?.id || '',
      name: searchProduct.brand?.name || '',
      slug: searchProduct.brand?.slug || '',
      minimumOrderAmount: 0,
    },
    category: searchProduct.category ? {
      id: searchProduct.category,
      name: searchProduct.category,
      slug: searchProduct.category.toLowerCase().replace(/\s+/g, '-'),
    } : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================
// SEARCH API
// ============================================

/**
 * Search products with filters and pagination
 */
export async function searchProductsWithFilters(
  query: string,
  filters: SearchFilters = {}
): Promise<SearchResults> {
  try {
    const params = new URLSearchParams();
    params.append('q', query);

    if (filters.brandId) params.append('brandId', filters.brandId);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.inStock !== undefined) params.append('inStock', filters.inStock.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const response = await api.get<ApiResponse<SearchResults>>(`/search?${params.toString()}`);

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get search suggestions for autocomplete
 */
export async function getSearchSuggestions(query: string, limit: number = 10): Promise<Suggestions> {
  try {
    if (!query || query.length < 2) {
      return { products: [], brands: [], categories: [] };
    }

    const response = await api.get<ApiResponse<Suggestions>>(
      `/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return { products: [], brands: [], categories: [] };
  }
}

/**
 * Get popular search queries
 */
export async function getPopularSearches(limit: number = 10): Promise<PopularSearch[]> {
  try {
    const response = await api.get<ApiResponse<PopularSearch[]>>(
      `/search/popular?limit=${limit}`
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching popular searches:', error);
    return [];
  }
}

/**
 * Get user's search history (requires authentication)
 */
export async function getSearchHistory(limit: number = 10): Promise<SearchHistoryItem[]> {
  try {
    const response = await api.get<ApiResponse<SearchHistoryItem[]>>(
      `/search/history?limit=${limit}`
    );

    return response.data.data;
  } catch (error) {
    console.error('Error fetching search history:', error);
    return [];
  }
}

/**
 * Get "Did you mean" suggestion for a query
 */
export async function getDidYouMean(query: string): Promise<string | null> {
  try {
    const response = await api.get<ApiResponse<{ suggestion: string | null }>>(
      `/search/did-you-mean?q=${encodeURIComponent(query)}`
    );

    return response.data.data.suggestion;
  } catch (error) {
    console.error('Error fetching did-you-mean:', error);
    return null;
  }
}

/**
 * Log when user clicks on a search result
 */
export async function logSearchClick(searchLogId: string, productId: string): Promise<void> {
  try {
    await api.post('/search/log-click', { searchLogId, productId });
  } catch (error) {
    console.error('Error logging search click:', error);
  }
}

/**
 * Track product view
 */
export async function trackProductView(productId: string): Promise<void> {
  try {
    await api.post('/search/track-view', { productId });
  } catch (error) {
    console.error('Error tracking product view:', error);
  }
}
