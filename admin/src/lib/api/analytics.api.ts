import api, { ApiResponse, getErrorMessage, buildQueryString } from '../api';

// ============================================
// TYPES
// ============================================

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalCustomers: number;
  customersChange: number;
  totalProducts: number;
  productsChange: number;
  averageOrderValue: number;
  aovChange: number;
  pendingOrders: number;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusData {
  status: string;
  count: number;
  label?: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  image?: string | null;
  brand?: {
    id: string;
    name: string;
  };
  totalSold: number;
  revenue: number;
}

export interface TopBrand {
  id: string;
  name: string;
  logo?: string | null;
  totalOrders: number;
  revenue: number;
}

export interface TopCustomer {
  id: string;
  businessName: string;
  user: {
    name: string;
    email: string;
  };
  totalOrders: number;
  totalSpent: number;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  brandId?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

// ============================================
// ANALYTICS API
// ============================================

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(filters?: AnalyticsFilters): Promise<DashboardStats> {
  try {
    const queryString = buildQueryString((filters || {}) as Record<string, unknown>);
    const response = await api.get<ApiResponse<DashboardStats>>(`/analytics/dashboard${queryString}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get sales over time data
 */
export async function getSalesOverTime(filters?: AnalyticsFilters): Promise<SalesDataPoint[]> {
  try {
    const queryString = buildQueryString((filters || {}) as Record<string, unknown>);
    const response = await api.get<ApiResponse<SalesDataPoint[]>>(`/analytics/sales${queryString}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get orders by status
 */
export async function getOrdersByStatus(filters?: AnalyticsFilters): Promise<OrderStatusData[]> {
  try {
    const queryString = buildQueryString((filters || {}) as Record<string, unknown>);
    const response = await api.get<ApiResponse<OrderStatusData[]>>(`/analytics/orders-by-status${queryString}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get top selling products
 */
export async function getTopProducts(limit: number = 5, filters?: AnalyticsFilters): Promise<TopProduct[]> {
  try {
    const queryString = buildQueryString({ ...filters, limit } as Record<string, unknown>);
    const response = await api.get<ApiResponse<TopProduct[]>>(`/analytics/top-products${queryString}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get top brands by revenue
 */
export async function getTopBrands(limit: number = 5, filters?: AnalyticsFilters): Promise<TopBrand[]> {
  try {
    const queryString = buildQueryString({ ...filters, limit } as Record<string, unknown>);
    const response = await api.get<ApiResponse<TopBrand[]>>(`/analytics/top-brands${queryString}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get top customers by spending
 */
export async function getTopCustomers(limit: number = 5, filters?: AnalyticsFilters): Promise<TopCustomer[]> {
  try {
    const queryString = buildQueryString({ ...filters, limit } as Record<string, unknown>);
    const response = await api.get<ApiResponse<TopCustomer[]>>(`/analytics/top-customers${queryString}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get revenue by brand
 */
export async function getRevenueByBrand(filters?: AnalyticsFilters): Promise<{ brandId: string; brandName: string; revenue: number }[]> {
  try {
    const queryString = buildQueryString((filters || {}) as Record<string, unknown>);
    const response = await api.get<ApiResponse<{ brandId: string; brandName: string; revenue: number }[]>>(`/analytics/revenue-by-brand${queryString}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get revenue by category
 */
export async function getRevenueByCategory(filters?: AnalyticsFilters): Promise<{ categoryId: string; categoryName: string; revenue: number }[]> {
  try {
    const queryString = buildQueryString((filters || {}) as Record<string, unknown>);
    const response = await api.get<ApiResponse<{ categoryId: string; categoryName: string; revenue: number }[]>>(`/analytics/revenue-by-category${queryString}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Export analytics report
 */
export async function exportAnalyticsReport(filters?: AnalyticsFilters): Promise<Blob> {
  try {
    const queryString = buildQueryString((filters || {}) as Record<string, unknown>);
    const response = await api.get(`/analytics/export${queryString}`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
