import api, { ApiResponse, PaginationMeta, getErrorMessage, buildQueryString } from '../api';
import type { Product } from '@/types';

// ============================================
// TYPES
// ============================================

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  brandId?: string;
  category?: string;
  status?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'quantity';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductData {
  brandId?: string;
  name: string;
  slug?: string;
  description?: string;
  costPrice?: number;
  wholesalePrice: number;
  retailPrice: number;
  sku: string;
  images?: string[];
  stockQuantity: number;
  lowStockThreshold?: number;
  status?: boolean;
  category?: string;
}

export interface UpdateProductData {
  brandId?: string;
  name?: string;
  slug?: string;
  description?: string;
  costPrice?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  sku?: string;
  images?: string[];
  stockQuantity?: number;
  lowStockThreshold?: number;
  status?: boolean;
  category?: string;
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

export interface StockUpdateData {
  quantity: number;
  operation?: 'set' | 'increment' | 'decrement';
}

export interface BulkStockUpdateData {
  updates: Array<{
    productId: string;
    quantity: number;
    operation?: 'set' | 'increment' | 'decrement';
  }>;
}

export interface InventoryItem {
  productId?: string;
  sku?: string;
  quantity?: number;
  costPrice?: number;
  wholesalePrice?: number;
  price?: number;
  lowStockThreshold?: number;
}

export interface InventoryExportItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  quantity: number;
  lowStockThreshold: number;
  costPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  status: string;
}

// ============================================
// PRODUCTS API
// ============================================

/**
 * Get all products with optional filters
 */
export async function getAllProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
  try {
    const queryString = buildQueryString(filters as Record<string, unknown>);
    const response = await api.get<ApiResponse<{ products: Product[]; pagination: { total: number; page: number; limit: number; pages: number } }>>(`/products${queryString}`);

    const products = response.data.data?.products || [];
    const pagination = response.data.data?.pagination || {
      total: products.length,
      pages: 1,
      page: filters.page || 1,
      limit: filters.limit || 10,
    };

    return {
      data: products,
      pagination,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string): Promise<{ data: Product }> {
  try {
    const response = await api.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
    return { data: response.data.data.product };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get a single product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  try {
    const response = await api.get<ApiResponse<{ product: Product }>>(`/products/slug/${slug}`);
    return response.data.data.product;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Create a new product
 */
export async function createProduct(data: CreateProductData): Promise<{ data: Product }> {
  try {
    // Map frontend field names to backend expected field names
    const backendData = {
      brandId: data.brandId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      costPrice: data.costPrice || 0, // Admin-only cost price
      wholesalePrice: data.wholesalePrice,
      price: data.retailPrice, // Backend expects 'price' not 'retailPrice'
      sku: data.sku,
      images: data.images,
      quantity: data.stockQuantity, // Backend expects 'quantity' not 'stockQuantity'
      lowStockThreshold: data.lowStockThreshold || 10,
      status: data.status,
      category: data.category,
    };
    const response = await api.post<ApiResponse<{ product: Product }>>('/products', backendData);
    return { data: response.data.data.product };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, data: UpdateProductData): Promise<Product> {
  try {
    // Map frontend field names to backend expected field names
    const backendData: Record<string, unknown> = {};

    if (data.brandId !== undefined) backendData.brandId = data.brandId;
    if (data.name !== undefined) backendData.name = data.name;
    if (data.slug !== undefined) backendData.slug = data.slug;
    if (data.description !== undefined) backendData.description = data.description;
    if (data.costPrice !== undefined) backendData.costPrice = data.costPrice; // Admin-only cost price
    if (data.wholesalePrice !== undefined) backendData.wholesalePrice = data.wholesalePrice;
    if (data.retailPrice !== undefined) backendData.price = data.retailPrice; // Map retailPrice to price
    if (data.sku !== undefined) backendData.sku = data.sku;
    if (data.images !== undefined) backendData.images = data.images;
    if (data.stockQuantity !== undefined) backendData.quantity = data.stockQuantity; // Map stockQuantity to quantity
    if (data.lowStockThreshold !== undefined) backendData.lowStockThreshold = data.lowStockThreshold;
    if (data.status !== undefined) backendData.status = data.status;
    if (data.category !== undefined) backendData.category = data.category;

    const response = await api.put<ApiResponse<{ product: Product }>>(`/products/${id}`, backendData);
    return response.data.data.product;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Delete a product (soft delete)
 */
export async function deleteProduct(id: string, hard: boolean = false): Promise<void> {
  try {
    const queryString = hard ? '?hard=true' : '';
    await api.delete(`/products/${id}${queryString}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Restore a soft-deleted product
 */
export async function restoreProduct(id: string): Promise<Product> {
  try {
    const response = await api.patch<ApiResponse<{ product: Product }>>(`/products/${id}/restore`);
    return response.data.data.product;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update product stock
 */
export async function updateStock(id: string, data: StockUpdateData): Promise<Product> {
  try {
    const response = await api.patch<ApiResponse<{ product: Product }>>(`/products/${id}/stock`, data);
    return response.data.data.product;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Bulk update stock for multiple products
 */
export async function bulkUpdateStock(data: BulkStockUpdateData): Promise<{
  updated: number;
  failed: Array<{ productId: string; error: string }>;
}> {
  try {
    const response = await api.patch<
      ApiResponse<{
        updated: number;
        failed: Array<{ productId: string; error: string }>;
      }>
    >('/products/stock/bulk', data);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get related products
 */
export async function getRelatedProducts(id: string, limit: number = 4): Promise<Product[]> {
  try {
    const response = await api.get<ApiResponse<{ products: Product[] }>>(`/products/${id}/related?limit=${limit}`);
    return response.data.data?.products || [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(threshold: number = 10): Promise<Product[]> {
  try {
    const response = await api.get<ApiResponse<{ products: Product[] }>>(`/products/low-stock?threshold=${threshold}`);
    return response.data.data?.products || [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get all product categories
 */
export async function getCategories(): Promise<string[]> {
  try {
    const response = await api.get<ApiResponse<{ categories: string[] }>>('/products/categories');
    return response.data.data?.categories || [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Upload product image
 */
export async function uploadProductImage(file: File): Promise<{ url: string }> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post<ApiResponse<{ url: string }>>('/products/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Upload multiple product images
 */
export async function uploadProductImages(productId: string, files: File[]): Promise<{ urls: string[] }> {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await api.post<ApiResponse<{ urls: string[] }>>(
      `/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get products by IDs
 */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  try {
    const response = await api.post<ApiResponse<Product[]>>('/products/by-ids', { ids });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ============================================
// INVENTORY API
// ============================================

/**
 * Get inventory list with full pricing info
 */
export async function getInventory(filters: ProductFilters = {}): Promise<ProductsResponse> {
  try {
    const queryString = buildQueryString(filters as Record<string, unknown>);
    const response = await api.get<ApiResponse<{ products: Product[]; pagination: { total: number; page: number; limit: number; pages: number } }>>(`/products/inventory${queryString}`);

    const products = response.data.data?.products || [];
    const pagination = response.data.data?.pagination || {
      total: products.length,
      pages: 1,
      page: filters.page || 1,
      limit: filters.limit || 50,
    };

    return {
      data: products,
      pagination,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Bulk update inventory
 */
export async function bulkUpdateInventory(items: InventoryItem[]): Promise<{ updated: number; errors: string[] }> {
  try {
    const response = await api.patch<ApiResponse<{ updated: number; errors: string[] }>>('/products/inventory/bulk', { items });
    return response.data.data || { updated: 0, errors: [] };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Export inventory data
 */
export async function exportInventory(brandId?: string): Promise<InventoryExportItem[]> {
  try {
    const queryString = brandId ? `?brandId=${brandId}` : '';
    const response = await api.get<ApiResponse<{ products: InventoryExportItem[] }>>(`/products/inventory/export${queryString}`);
    return response.data.data?.products || [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
