'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
  LoginCredentials,
  RegisterData,
} from '@/lib/auth';
import { useAuthStore } from '@/store/auth.store';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();

  // Use Zustand store for auth state - single source of truth
  const user = useAuthStore((state) => state.user) as User | null;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const storeLogout = useAuthStore((state) => state.logout);
  const initialize = useAuthStore((state) => state.initialize);
  const storeRefreshUser = useAuthStore((state) => state.refreshUser);

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await loginApi(credentials);
      setUser(response.user as User);
      router.push('/');
    },
    [router, setUser]
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout API errors
    }
    storeLogout();
    router.push('/login');
  }, [router, storeLogout]);

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await registerApi(data);
      setUser(response.user as User);
      router.push('/');
    },
    [router, setUser]
  );

  const refreshUser = useCallback(async () => {
    await storeRefreshUser();
  }, [storeRefreshUser]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    refreshUser,
  };
}

export default useAuth;
