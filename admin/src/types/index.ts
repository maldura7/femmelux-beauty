// Re-export types from shared package when available
// For now, define local types

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'VENDOR' | 'CUSTOMER';
  brandId?: string;
  businessName?: string;
  taxId?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  minimumOrder: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    vendors: number;
  };
}

export interface Product {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  description?: string;
  costPrice?: number;
  wholesalePrice: number;
  price: number;
  sku: string;
  images: string[];
  quantity: number;
  lowStockThreshold?: number;
  status: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  brand?: Brand;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: Address;
  billingAddress: Address;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  items?: OrderItem[];
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  recentOrders: Order[];
  topProducts: Array<{
    product: Product;
    totalSold: number;
    revenue: number;
  }>;
}
