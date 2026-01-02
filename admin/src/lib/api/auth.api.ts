import api, { ApiResponse, getErrorMessage } from '../api';
import {
  saveAuthData,
  logout as clearAuth,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ChangePasswordData,
} from '../auth';
import type { User } from '@/types';

// ============================================
// AUTHENTICATION API
// ============================================

/**
 * Login user with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const data = response.data.data;

    // Store auth data
    saveAuthData({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });

    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Register a new user
 */
export async function register(userData: RegisterData): Promise<AuthResponse> {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    const data = response.data.data;

    // Store auth data
    saveAuthData({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });

    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<User> {
  try {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Update current user profile
 */
export async function updateProfile(data: Partial<User>): Promise<User> {
  try {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Change user password
 */
export async function changePassword(data: ChangePasswordData): Promise<void> {
  try {
    await api.post('/auth/change-password', data);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Logout user (server-side + client-side cleanup)
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Ignore errors - still clear local auth state
    console.warn('Logout API call failed:', getErrorMessage(error));
  } finally {
    clearAuth();
  }
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<void> {
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

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<void> {
  try {
    await api.post('/auth/verify-email', { token });
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  try {
    const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh-token',
      { refreshToken }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
