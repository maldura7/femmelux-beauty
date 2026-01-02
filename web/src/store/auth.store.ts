import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, getCurrentUser, getAccessToken, getStoredUser } from '@/lib/auth';

// ============================================
// TYPES
// ============================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  logout: () => void;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================
// AUTH STORE
// ============================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      // Set user
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      // Set authenticated state
      setIsAuthenticated: (isAuthenticated) => {
        set({ isAuthenticated });
      },

      // Set loading state
      setIsLoading: (isLoading) => {
        set({ isLoading });
      },

      // Logout - clear all auth state
      logout: () => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
        set({ user: null, isAuthenticated: false });
      },

      // Initialize auth state from localStorage
      initialize: async () => {
        set({ isLoading: true });

        try {
          const token = getAccessToken();
          if (!token) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          // Try to get user from localStorage first
          const storedUser = getStoredUser();
          if (storedUser) {
            set({ user: storedUser, isAuthenticated: true });
          }

          // Then refresh from API (but don't fail if it errors)
          try {
            const user = await getCurrentUser();
            set({ user, isAuthenticated: true });
            // Update localStorage with fresh data
            if (typeof window !== 'undefined') {
              localStorage.setItem('user', JSON.stringify(user));
            }
          } catch (error) {
            // API call failed, but we have stored user and token, so keep them logged in
            // The token refresh will happen automatically on next API call if needed
            if (storedUser) {
              // Keep the user logged in with stored data
              set({ user: storedUser, isAuthenticated: true });
            } else {
              // No stored user and API failed - they need to login
              set({ user: null, isAuthenticated: false });
            }
          }
        } catch (error) {
          // Keep user logged in if we have token and stored user
          const token = getAccessToken();
          const storedUser = getStoredUser();
          if (token && storedUser) {
            set({ user: storedUser, isAuthenticated: true });
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh user data from API
      refreshUser: async () => {
        try {
          const user = await getCurrentUser();
          set({ user, isAuthenticated: true });
          // Update localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (error) {
          // If refresh fails, don't logout - just keep current state
          console.error('Failed to refresh user:', error);
        }
      },
    }),
    {
      name: 'femmelux-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, check if we have a valid token
        if (state) {
          const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
          const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

          if (!token) {
            // No token - clear auth
            state.user = null;
            state.isAuthenticated = false;
          } else if (storedUser && !state.user) {
            // We have token and stored user but state.user is null - restore from localStorage
            try {
              const parsedUser = JSON.parse(storedUser);
              state.user = parsedUser;
              state.isAuthenticated = true;
            } catch {
              // Invalid JSON, keep current state
            }
          } else if (token && state.user) {
            // We have both token and user - ensure authenticated is true
            state.isAuthenticated = true;
          }
          state.isLoading = false;
        }
      },
    }
  )
);

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.isAuthenticated);
}

/**
 * Hook to get current user
 */
export function useUser(): User | null {
  return useAuthStore((state) => state.user);
}

/**
 * Hook to check if auth is loading
 */
export function useAuthLoading(): boolean {
  return useAuthStore((state) => state.isLoading);
}

// ============================================
// SELECTORS
// ============================================

export const authSelectors = {
  user: (state: AuthState) => state.user,
  isAuthenticated: (state: AuthState) => state.isAuthenticated,
  isLoading: (state: AuthState) => state.isLoading,
};
