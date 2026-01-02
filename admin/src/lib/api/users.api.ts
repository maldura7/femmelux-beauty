import api, { ApiResponse, getErrorMessage } from '../api';

// ============================================
// TYPES
// ============================================

export type UserRole = 'ADMIN' | 'VENDOR' | 'CUSTOMER';
export type AccountStatus = 'GUEST' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  businessName?: string;
  businessType?: string;
  phone?: string;
  businessAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  businessWebsite?: string;
  businessYears?: number;
  businessLicense?: string;
  resaleCertificate?: string;
  taxId?: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  appliedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  suspendedAt?: string;
  suspensionReason?: string;
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  rejecter?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface UserFilters {
  role?: UserRole;
  accountStatus?: AccountStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface UsersPaginatedResponse {
  data: User[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface UserStats {
  total: number;
  customers: number;
  vendors: number;
  admins: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all users with filters
 */
export async function getAllUsers(
  filters: UserFilters = {}
): Promise<UsersPaginatedResponse> {
  try {
    const params = new URLSearchParams();

    if (filters.role) params.append('role', filters.role);
    if (filters.accountStatus) params.append('accountStatus', filters.accountStatus);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get<{
      success: boolean;
      data: User[];
      pagination: { total: number; page: number; pages: number; limit: number };
    }>(`/users?${params.toString()}`);

    if (response.data.success && response.data.data) {
      return {
        data: response.data.data,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        totalPages: response.data.pagination.pages,
        limit: response.data.pagination.limit,
      };
    }
    throw new Error('Failed to fetch users');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get user by ID
 */
export async function getUser(id: string): Promise<User> {
  try {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('User not found');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const response = await api.get<ApiResponse<UserStats>>('/users/stats');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch user stats');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update user status (active/inactive)
 */
export async function updateUserStatus(id: string, status: boolean): Promise<User> {
  try {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/status`, { status });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to update user status');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update user role
 */
export async function updateUserRole(id: string, role: UserRole): Promise<User> {
  try {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/role`, { role });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to update user role');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get role badge color
 */
export function getRoleColor(role: UserRole): {
  bg: string;
  text: string;
} {
  switch (role) {
    case 'ADMIN':
      return { bg: 'bg-purple-100', text: 'text-purple-800' };
    case 'VENDOR':
      return { bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'CUSTOMER':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

/**
 * Get account status badge color
 */
export function getAccountStatusColor(status: AccountStatus): {
  bg: string;
  text: string;
} {
  switch (status) {
    case 'APPROVED':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'PENDING':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    case 'REJECTED':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'SUSPENDED':
      return { bg: 'bg-orange-100', text: 'text-orange-800' };
    case 'GUEST':
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get user full name
 */
export function getFullName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`;
}
