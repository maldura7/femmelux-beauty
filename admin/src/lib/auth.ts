import type { User } from '@/types';
import type { AuthUser } from '@/lib/api';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

// ============================================
// TOKEN MANAGEMENT
// ============================================

/**
 * Save access token to localStorage
 */
export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
}

/**
 * Get access token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Remove access token from localStorage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Save refresh token to localStorage
 */
export function saveRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Remove refresh token from localStorage
 */
export function removeRefreshToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Save user to localStorage
 */
export function saveUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

/**
 * Get user from localStorage
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
}

/**
 * Alias for getUser (for compatibility with useAuth hook)
 */
export function getStoredUser(): User | null {
  return getUser();
}

/**
 * Remove user from localStorage
 */
export function removeUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.USER);
}

// ============================================
// AUTH STATE HELPERS
// ============================================

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  // Optionally check if token is expired (basic JWT check)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() < exp;
  } catch {
    return false;
  }
}

/**
 * Check if current user is an admin
 */
export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === 'ADMIN';
}

/**
 * Check if current user is a vendor
 */
export function isVendor(): boolean {
  const user = getUser();
  return user?.role === 'VENDOR';
}

/**
 * Check if current user is a customer
 */
export function isCustomer(): boolean {
  const user = getUser();
  return user?.role === 'CUSTOMER';
}

/**
 * Check if current user has one of the specified roles
 */
export function hasRole(roles: Array<'ADMIN' | 'VENDOR' | 'CUSTOMER'>): boolean {
  const user = getUser();
  return user ? roles.includes(user.role) : false;
}

/**
 * Check if current user can access admin panel
 */
export function canAccessAdmin(): boolean {
  return hasRole(['ADMIN', 'VENDOR']);
}

// ============================================
// AUTH ACTIONS
// ============================================

/**
 * Save all auth data (tokens + user)
 * Accepts AuthUser from login API and converts to User format for storage
 */
export function saveAuthData(data: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}): void {
  saveToken(data.accessToken);
  saveRefreshToken(data.refreshToken);
  // Convert AuthUser to User format for storage
  const fullName = data.user.name || `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim();
  const userToStore: User = {
    id: data.user.id,
    email: data.user.email,
    firstName: data.user.firstName || fullName.split(' ')[0] || '',
    lastName: data.user.lastName || fullName.split(' ').slice(1).join(' ') || '',
    name: fullName,
    role: data.user.role,
    brandId: data.user.brandId || undefined,
    status: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveUser(userToStore);
}

/**
 * Clear all auth data (logout)
 */
export function logout(): void {
  removeToken();
  removeRefreshToken();
  removeUser();
}

/**
 * Get current auth state
 */
export function getAuthState(): {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
} {
  return {
    isAuthenticated: isAuthenticated(),
    user: getUser(),
    token: getToken(),
  };
}

// ============================================
// TYPES (Re-export for convenience)
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'VENDOR';
  businessName?: string;
  taxId?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export type { User };
