import api, { ApiResponse, PaginationMeta, getErrorMessage, buildQueryString } from '../api';
import type { Brand, Product } from '@/types';

// ============================================
// TYPES
// ============================================

export interface BrandFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  sortBy?: 'name' | 'createdAt' | 'minimumOrder';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateBrandData {
  name: string;
  slug?: string;
  logo?: string;
  description?: string;
  minimumOrder: number;
  status?: boolean;
}

export interface UpdateBrandData {
  name?: string;
  slug?: string;
  logo?: string;
  description?: string;
  minimumOrder?: number;
  status?: boolean;
}

export interface BrandWithProducts extends Brand {
  products: Product[];
}

export interface BrandsResponse {
  brands: Brand[];
  meta: PaginationMeta;
}

export interface BrandProductsResponse {
  products: Product[];
  meta: PaginationMeta;
}

// ============================================
// BRANDS API
// ============================================

/**
 * Get all brands with optional filters
 */
export async function getAllBrands(filters: BrandFilters = {}): Promise<BrandsResponse> {
  try {
    const queryString = buildQueryString(filters);
    const response = await api.get<ApiResponse<{ brands: Brand[] }>>(`/brands${queryString}`);

    const brands = response.data.data?.brands || [];
    return {
      brands,
      meta: response.data.meta || {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: brands.length,
        totalPages: 1,
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get a single brand by ID
 */
export async function getBrand(id: string): Promise<Brand> {
  try {
    const response = await api.get<ApiResponse<{ brand: Brand }>>(`/brands/${id}`);
    return response.data.data.brand;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get a single brand by slug
 */
export async function getBrandBySlug(slug: string): Promise<Brand> {
  try {
    const response = await api.get<ApiResponse<{ brand: Brand }>>(`/brands/slug/${slug}`);
    return response.data.data.brand;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Create a new brand
 */
export async function createBrand(data: CreateBrandData): Promise<Brand> {
  try {
    const response = await api.post<ApiResponse<{ brand: Brand }>>('/brands', data);
    return response.data.data.brand;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update an existing brand
 */
export async function updateBrand(id: string, data: UpdateBrandData): Promise<Brand> {
  try {
    const response = await api.put<ApiResponse<{ brand: Brand }>>(`/brands/${id}`, data);
    return response.data.data.brand;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Delete a brand and all its associated products (hard delete)
 */
export async function deleteBrand(id: string): Promise<void> {
  try {
    // Use hardDelete=true to cascade delete all products
    await api.delete(`/brands/${id}?hardDelete=true`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Restore a soft-deleted brand
 */
export async function restoreBrand(id: string): Promise<Brand> {
  try {
    const response = await api.patch<ApiResponse<{ brand: Brand }>>(`/brands/${id}/restore`);
    return response.data.data.brand;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get products for a specific brand
 */
export async function getBrandProducts(
  brandId: string,
  page: number = 1,
  limit: number = 10
): Promise<BrandProductsResponse> {
  try {
    const queryString = buildQueryString({ page, limit });
    const response = await api.get<ApiResponse<{ products: Product[]; pagination: PaginationMeta }>>(`/brands/${brandId}/products${queryString}`);

    const products = response.data.data?.products || [];
    return {
      products,
      meta: response.data.data?.pagination || {
        page,
        limit,
        total: products.length,
        totalPages: 1,
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Validate minimum order requirements for cart items
 */
export async function validateCart(
  items: Array<{ brandId: string; subtotal: number }>
): Promise<{
  valid: boolean;
  errors: Array<{ brandId: string; brandName: string; minimumOrder: number; currentTotal: number }>;
}> {
  try {
    const response = await api.post<
      ApiResponse<{
        valid: boolean;
        errors: Array<{ brandId: string; brandName: string; minimumOrder: number; currentTotal: number }>;
      }>
    >('/brands/validate-cart', { items });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Search brands by name
 */
export async function searchBrands(query: string, limit: number = 10): Promise<Brand[]> {
  try {
    const response = await api.get<ApiResponse<{ brands: Brand[] }>>(
      `/brands/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.data.data?.brands || [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get brand statistics
 */
export async function getBrandStats(id: string): Promise<{
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}> {
  try {
    const response = await api.get<
      ApiResponse<{
        stats: {
          totalProducts: number;
          totalOrders: number;
          totalRevenue: number;
          averageOrderValue: number;
        };
      }>
    >(`/brands/${id}/stats`);
    return response.data.data?.stats || {
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
