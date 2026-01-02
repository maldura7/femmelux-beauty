'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getStoredUser,
  isAuthenticated as checkIsAuthenticated,
  saveAuthData,
  logout as clearAuth,
} from '@/lib/auth';
import {
  login as loginApi,
  register as registerApi,
  getProfile,
  updateProfile as updateProfileApi,
  changePassword as changePasswordApi,
  logout as logoutApi,
} from '@/lib/api/auth.api';
import { getPath } from '@/lib/navigation';
import type { User } from '@/types';
import type { AuthResponse } from '@/lib/auth';

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

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check if we have a valid token
  const hasValidToken = checkIsAuthenticated();

  // Get current user
  const {
    data: user,
    isLoading: queryLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user'],
    queryFn: getProfile,
    enabled: hasValidToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    initialData: () => getStoredUser() || undefined,
  });

  // isLoading should be false if we don't have a valid token
  const isLoading = hasValidToken ? (queryLoading && isFetching) : false;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => loginApi(credentials),
    onSuccess: (data: AuthResponse) => {
      saveAuthData({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      queryClient.setQueryData(['user'], data.user);
      toast.success('Welcome back!');
      window.location.href = getPath('/dashboard');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => registerApi(data),
    onSuccess: (data: AuthResponse) => {
      saveAuthData({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      queryClient.setQueryData(['user'], data.user);
      toast.success('Account created successfully!');
      window.location.href = getPath('/dashboard');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success('Logged out successfully');
      window.location.href = getPath('/login');
    },
    onError: () => {
      // Still clear and redirect even on error
      clearAuth();
      queryClient.clear();
      window.location.href = getPath('/login');
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<User>) => updateProfileApi(data),
    onSuccess: (updatedUser: User) => {
      queryClient.setQueryData(['user'], updatedUser);
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      changePasswordApi({ currentPassword, newPassword }),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user || hasValidToken,
    isAdmin: user?.role === 'ADMIN',
    isVendor: user?.role === 'VENDOR',
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    refetch,
  };
}

export default useAuth;
