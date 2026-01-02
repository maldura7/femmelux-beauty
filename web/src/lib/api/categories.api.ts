import api, { ApiResponse, getErrorMessage, buildQueryString } from '../api';

// ============================================
// TYPES
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  productCount?: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CategoryFilters {
  page?: number;
  limit?: number;
  parentId?: string;
  isActive?: boolean;
}

export interface CategoriesResponse {
  data: Category[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

// ============================================
// CATEGORIES API
// ============================================

/**
 * Get all categories
 */
export async function getCategories(filters: CategoryFilters = {}): Promise<CategoriesResponse> {
  try {
    const queryString = buildQueryString({ ...filters, isActive: true });
    const response = await api.get<ApiResponse<Category[]>>(`/categories${queryString}`);

    const meta = response.data.meta || {
      page: filters.page || 1,
      limit: filters.limit || 50,
      total: response.data.data.length,
      totalPages: 1,
    };

    return {
      data: response.data.data,
      pagination: {
        total: meta.total,
        pages: meta.totalPages,
        page: meta.page,
        limit: meta.limit,
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category> {
  try {
    const response = await api.get<ApiResponse<Category>>(`/categories/slug/${slug}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get category by ID
 */
export async function getCategory(id: string): Promise<Category> {
  try {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get root categories (no parent)
 */
export async function getRootCategories(): Promise<Category[]> {
  try {
    const response = await api.get<ApiResponse<Category[]>>('/categories/root');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get category tree (hierarchical structure)
 */
export async function getCategoryTree(): Promise<Category[]> {
  try {
    const response = await api.get<ApiResponse<Category[]>>('/categories/tree');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
