// ============================================
// RE-EXPORT TYPES FROM API
// ============================================

export type {
  Brand,
  BrandFilters,
  BrandsResponse,
} from '@/lib/api/brands.api';

export type {
  Product,
  ProductImage,
  ProductVariant,
  PriceTier,
  ProductFilters,
  ProductsResponse,
} from '@/lib/api/products.api';

export type {
  Order,
  OrderItem,
  OrderAddress,
  OrderStatus,
  PaymentStatus,
  OrderFilters,
  OrdersResponse,
  CreateOrderData,
} from '@/lib/api/orders.api';

export type {
  Category,
  CategoryFilters,
  CategoriesResponse,
} from '@/lib/api/categories.api';

export type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '@/lib/auth';

export type {
  CartItem,
  CartBrandGroup,
  MinimumOrderValidationError,
} from '@/store/cart.store';

// ============================================
// COMMON TYPES
// ============================================

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

// ============================================
// UI TYPES
// ============================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface MenuItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}
