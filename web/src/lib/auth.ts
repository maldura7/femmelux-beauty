import api, { ApiResponse, getErrorMessage } from './api';

// ============================================
// TYPES
// ============================================

export type AccountStatus = 'GUEST' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  accountStatus: AccountStatus;
  businessName?: string | null;
  businessType?: string | null;
  taxId?: string | null;
  phone?: string | null;
  rejectionReason?: string | null;
  suspensionReason?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  businessType?: string;
  phone?: string;
  taxId?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============================================
// AUTH FUNCTIONS
// ============================================

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const { user, accessToken, refreshToken } = response.data.data;

    // Store tokens and user
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Register a new customer account
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    const { user, accessToken, refreshToken } = response.data.data;

    // Store tokens and user
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Logout - clear tokens and user data
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Ignore logout errors
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

/**
 * Get current user from API
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    const user = response.data.data.user;
    // Update stored user with fresh data from server
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update user profile
 */
export async function updateProfile(data: Partial<User>): Promise<User> {
  try {
    const response = await api.patch<ApiResponse<{ user: User }>>('/auth/profile', data);
    const user = response.data.data.user;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Change password
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  try {
    await api.post('/auth/change-password', data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await api.post('/auth/forgot-password', { email });
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  try {
    await api.post('/auth/reset-password', { token, newPassword });
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user is authenticated (client-side)
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

/**
 * Get stored user (client-side)
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Get access token
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

// ============================================
// ACCOUNT STATUS HELPERS
// ============================================

/**
 * Check if user can see wholesale prices
 * Only admins, vendors, and approved customers can see prices
 */
export function canSeePrices(user: User | null | undefined): boolean {
  if (!user) return false;

  // Admins and vendors can always see prices
  if (user.role === 'ADMIN' || user.role === 'VENDOR') {
    return true;
  }

  // Approved customers can see prices
  return user.accountStatus === 'APPROVED';
}

/**
 * Check if user's account is approved
 */
export function isApproved(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.accountStatus === 'APPROVED';
}

/**
 * Check if user has a pending application
 */
export function isPending(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.accountStatus === 'PENDING';
}

/**
 * Check if user's application was rejected
 */
export function isRejected(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.accountStatus === 'REJECTED';
}

/**
 * Check if user's account is suspended
 */
export function isSuspended(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.accountStatus === 'SUSPENDED';
}

/**
 * Check if user is a guest (registered but hasn't applied)
 */
export function isGuest(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.accountStatus === 'GUEST';
}

/**
 * Check if user can place orders
 * Only approved customers, vendors, and admins can order
 */
export function canPlaceOrders(user: User | null | undefined): boolean {
  if (!user) return false;

  // Admins and vendors can always place orders
  if (user.role === 'ADMIN' || user.role === 'VENDOR') {
    return true;
  }

  // Only approved customers can place orders
  return user.accountStatus === 'APPROVED';
}

/**
 * Get user's full name
 */
export function getUserFullName(user: User | null | undefined): string {
  if (!user) return '';
  return `${user.firstName} ${user.lastName}`.trim();
}
