import api, { ApiResponse, PaginationMeta, getErrorMessage, buildQueryString } from '../api';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

// ============================================
// TYPES
// ============================================

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | string;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  brandId?: string;
  dateFrom?: string;
  dateTo?: string;
  startDate?: string;
  endDate?: string;
  minTotal?: number;
  maxTotal?: number;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface OrdersResponse {
  data: Order[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    limit: number;
  };
}

export interface UpdateOrderStatusData {
  status: OrderStatus;
  notes?: string;
}

export interface UpdatePaymentStatusData {
  paymentStatus: PaymentStatus;
  transactionId?: string;
}

export interface AddTrackingData {
  trackingNumber: string;
  carrier?: string;
  estimatedDelivery?: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

// ============================================
// ORDERS API
// ============================================

/**
 * Get all orders with optional filters (Admin only)
 */
export async function getAllOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
  try {
    // Map dateFrom/dateTo to startDate/endDate for API
    const apiFilters = {
      ...filters,
      startDate: filters.dateFrom || filters.startDate,
      endDate: filters.dateTo || filters.endDate,
    };
    const queryString = buildQueryString(apiFilters);
    const response = await api.get<ApiResponse<{ orders: Order[]; pagination?: PaginationMeta }>>(`/orders${queryString}`);

    // Handle both response formats: { data: Order[] } or { data: { orders: Order[] } }
    const responseData = response.data.data;
    const orders = Array.isArray(responseData) ? responseData : (responseData?.orders || []);

    const paginationData = !Array.isArray(responseData) && responseData?.pagination;
    const meta = paginationData || response.data.meta || {
      page: filters.page || 1,
      limit: filters.limit || 10,
      total: orders.length,
      totalPages: 1,
    };

    return {
      data: orders,
      pagination: {
        total: meta.total,
        pages: meta.totalPages || meta.pages || 1,
        page: meta.page,
        limit: meta.limit,
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get a single order by ID
 */
export async function getOrder(id: string): Promise<{ data: Order }> {
  try {
    const response = await api.get<ApiResponse<{ order: Order } | Order>>(`/orders/${id}`);
    // Backend returns { data: { order: {...} } }
    const responseData = response.data.data;
    const order = (responseData as { order: Order }).order || responseData as Order;
    return { data: order };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get a single order by order number
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order> {
  try {
    const response = await api.get<ApiResponse<{ order: Order } | Order>>(`/orders/number/${orderNumber}`);
    // Backend returns { data: { order: {...} } }
    const responseData = response.data.data;
    const order = (responseData as { order: Order }).order || responseData as Order;
    return order;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get orders for a specific brand (Vendor access)
 */
export async function getBrandOrders(
  brandId: string,
  filters: Omit<OrderFilters, 'brandId'> = {}
): Promise<OrdersResponse> {
  try {
    const queryString = buildQueryString(filters);
    const response = await api.get<ApiResponse<Order[]>>(`/brands/${brandId}/orders${queryString}`);

    return {
      orders: response.data.data,
      meta: response.data.meta || {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: response.data.data.length,
        totalPages: 1,
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get orders for current user (Customer)
 */
export async function getMyOrders(filters: Omit<OrderFilters, 'customerId'> = {}): Promise<OrdersResponse> {
  try {
    const queryString = buildQueryString(filters);
    const response = await api.get<ApiResponse<Order[]>>(`/orders/my${queryString}`);

    return {
      orders: response.data.data,
      meta: response.data.meta || {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: response.data.data.length,
        totalPages: 1,
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(id: string, status: string, notes?: string): Promise<Order> {
  try {
    // Convert status to uppercase for backend validation (expects PENDING, CONFIRMED, etc.)
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, {
      status: status.toUpperCase(),
      notes
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update payment status (Admin only)
 */
export async function updatePaymentStatus(id: string, data: UpdatePaymentStatusData): Promise<Order> {
  try {
    // Convert payment status to uppercase for backend validation
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/payment-status`, {
      ...data,
      paymentStatus: data.paymentStatus.toUpperCase(),
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Add tracking number to order
 */
export async function addTracking(id: string, data: AddTrackingData): Promise<Order> {
  try {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/tracking`, data);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  try {
    const response = await api.post<ApiResponse<Order>>(`/orders/${id}/cancel`, { reason });
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get order statistics
 */
export async function getOrderStats(filters?: {
  startDate?: string;
  endDate?: string;
  brandId?: string;
}): Promise<OrderStats> {
  try {
    const queryString = buildQueryString(filters || {});
    const response = await api.get<ApiResponse<OrderStats>>(`/orders/stats${queryString}`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get recent orders
 */
export async function getRecentOrders(limit: number = 5): Promise<Order[]> {
  try {
    const response = await api.get<ApiResponse<{ orders: Order[] } | Order[]>>(`/orders?limit=${limit}&sortBy=createdAt&sortOrder=desc`);

    // Handle both response formats: { data: Order[] } or { data: { orders: Order[] } }
    const responseData = response.data.data;
    const orders = Array.isArray(responseData) ? responseData : (responseData?.orders || []);

    return orders;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Export orders to CSV (Admin only)
 */
export async function exportOrders(filters: OrderFilters = {}): Promise<Blob> {
  try {
    const queryString = buildQueryString(filters);
    const response = await api.get(`/orders/export${queryString}`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(id: string): Promise<void> {
  try {
    await api.post(`/orders/${id}/send-confirmation`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotification(id: string): Promise<void> {
  try {
    await api.post(`/orders/${id}/send-shipping-notification`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
