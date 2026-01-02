import api, { ApiResponse, PaginationMeta, getErrorMessage, buildQueryString } from '../api';

// ============================================
// TYPES
// ============================================

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  website?: string;
  isActive: boolean;
  minimumOrderAmount: number;
  productCount?: number;
  createdAt: string;
}

// Backend brand type (what the API actually returns)
interface BackendBrand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  website?: string;
  status: boolean; // Backend uses 'status', frontend uses 'isActive'
  minimumOrder: number; // Backend uses 'minimumOrder', frontend uses 'minimumOrderAmount'
  productCount?: number;
  _count?: { products: number };
  createdAt: string;
}

// Transform backend brand to frontend Brand type
function transformBrand(backendBrand: BackendBrand): Brand {
  return {
    id: backendBrand.id,
    name: backendBrand.name,
    slug: backendBrand.slug,
    description: backendBrand.description,
    logo: backendBrand.logo,
    banner: backendBrand.banner,
    website: backendBrand.website,
    isActive: backendBrand.status,
    minimumOrderAmount: Number(backendBrand.minimumOrder) || 0,
    productCount: backendBrand.productCount ?? backendBrand._count?.products ?? 0,
    createdAt: backendBrand.createdAt,
  };
}

export interface BrandFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt' | 'productCount';
  sortOrder?: 'asc' | 'desc';
}

export interface BrandsResponse {
  data: Brand[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

// ============================================
// BRANDS API
// ============================================

/**
 * Get all active brands
 */
export async function getBrands(filters: BrandFilters = {}): Promise<BrandsResponse> {
  try {
    const queryString = buildQueryString({ ...filters, isActive: true });
    const response = await api.get<ApiResponse<{ brands: BackendBrand[] }>>(`/brands${queryString}`);

    // Handle both response formats: { data: BackendBrand[] } or { data: { brands: BackendBrand[] } }
    const brandsData = response.data.data;
    const backendBrands: BackendBrand[] = Array.isArray(brandsData) ? brandsData : (brandsData?.brands || []);

    // Transform backend brands to frontend format
    const brands = backendBrands.map(transformBrand);

    const meta = response.data.meta || {
      page: filters.page || 1,
      limit: filters.limit || 20,
      total: brands.length,
      totalPages: 1,
    };

    return {
      data: brands,
      pagination: {
        total: meta.total,
        pages: meta.totalPages ?? 1,
        page: meta.page,
        limit: meta.limit,
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get a single brand by slug
 */
export async function getBrandBySlug(slug: string): Promise<Brand> {
  try {
    const response = await api.get<ApiResponse<{ brand: BackendBrand }>>(`/brands/slug/${slug}`);
    // Handle both response formats
    const brandData = response.data.data;
    const backendBrand: BackendBrand = (brandData as { brand: BackendBrand }).brand || brandData as unknown as BackendBrand;
    return transformBrand(backendBrand);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get a single brand by ID
 */
export async function getBrand(id: string): Promise<Brand> {
  try {
    const response = await api.get<ApiResponse<{ brand: BackendBrand }>>(`/brands/${id}`);
    // Handle both response formats
    const brandData = response.data.data;
    const backendBrand: BackendBrand = (brandData as { brand: BackendBrand }).brand || brandData as unknown as BackendBrand;
    return transformBrand(backendBrand);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get featured brands
 */
export async function getFeaturedBrands(limit: number = 6): Promise<Brand[]> {
  try {
    const response = await api.get<ApiResponse<{ brands: BackendBrand[] }>>(`/brands/featured?limit=${limit}`);
    // Handle both response formats
    const brandsData = response.data.data;
    const backendBrands: BackendBrand[] = Array.isArray(brandsData)
      ? brandsData
      : (brandsData?.brands || []);
    return backendBrands.map(transformBrand);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
