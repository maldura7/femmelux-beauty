import api, { ApiResponse, getErrorMessage, buildQueryString } from '../api';

// ============================================
// TYPES
// ============================================

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  sku: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  price: number;
  total: number;
  brand: {
    id: string;
    name: string;
  };
}

export interface OrderAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  notes?: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    notes?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'total';
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

export interface CreateOrderData {
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  shippingAddress: OrderAddress;
  billingAddress?: OrderAddress;
  notes?: string;
  paymentMethod: string;
}

// ============================================
// ORDERS API
// ============================================

/**
 * Get customer's orders
 */
export async function getMyOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
  try {
    const queryString = buildQueryString(filters as Record<string, unknown>);
    const response = await api.get<ApiResponse<{ orders: Order[]; pagination: { total: number; page: number; limit: number; pages: number } }>>(`/orders/my${queryString}`);

    // Handle both response formats: { data: Order[] } or { data: { orders: Order[] } }
    const responseData = response.data.data;
    const orders = Array.isArray(responseData) ? responseData : (responseData?.orders || []);

    // Get pagination from nested response or meta
    const paginationData = !Array.isArray(responseData) && responseData?.pagination;
    const meta = paginationData || response.data.meta;
    const defaultMeta = {
      page: filters.page || 1,
      limit: filters.limit || 10,
      total: orders.length,
      pages: 1,
    };
    const finalMeta = meta ? {
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      pages: (meta as { pages?: number }).pages ?? (meta as { totalPages?: number }).totalPages ?? 1,
    } : defaultMeta;

    return {
      data: orders,
      pagination: {
        total: finalMeta.total,
        pages: finalMeta.pages,
        page: finalMeta.page,
        limit: finalMeta.limit,
      },
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get a single order by ID
 */
export async function getOrder(id: string): Promise<Order> {
  try {
    const response = await api.get<ApiResponse<{ order: Order }>>(`/orders/${id}`);
    // Backend returns { data: { order: {...} } }
    return response.data.data.order;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order> {
  try {
    const response = await api.get<ApiResponse<{ order: Order }>>(`/orders/number/${orderNumber}`);
    // Backend returns { data: { order: {...} } }
    return response.data.data.order;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Create a new order
 */
export async function createOrder(data: CreateOrderData): Promise<Order> {
  try {
    // Transform address format: frontend uses postalCode, backend expects zipCode
    const transformAddress = (addr: OrderAddress) => ({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.postalCode,
      country: addr.country,
    });

    const payload = {
      items: data.items,
      shippingAddress: transformAddress(data.shippingAddress),
      billingAddress: data.billingAddress ? transformAddress(data.billingAddress) : transformAddress(data.shippingAddress),
      notes: data.notes,
      paymentMethod: data.paymentMethod,
    };

    const response = await api.post<ApiResponse<{ order: Order }>>('/orders', payload);
    // Backend returns { data: { order: {...} } }
    return response.data.data.order;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  try {
    const response = await api.post<ApiResponse<{ order: Order }>>(`/orders/${id}/cancel`, { reason });
    // Backend returns { data: { order: {...} } }
    return response.data.data.order;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Reorder - create new order from existing order
 */
export async function reorder(orderId: string): Promise<Order> {
  try {
    const response = await api.post<ApiResponse<Order>>(`/orders/${orderId}/reorder`);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
