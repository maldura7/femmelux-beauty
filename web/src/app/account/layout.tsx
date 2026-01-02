'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  HomeIcon,
  ShoppingBagIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth.store';
import { getUserFullName, type User } from '@/lib/auth';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/account', icon: HomeIcon },
  { label: 'Orders', href: '/account/orders', icon: ShoppingBagIcon },
  { label: 'Profile', href: '/account/profile', icon: UserIcon },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Use Zustand store for auth state
  const user = useAuthStore((state) => state.user) as User | null;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeLogout = useAuthStore((state) => state.logout);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    // Redirect to login if not authenticated after loading completes
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account' as '/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    storeLogout();
    toast.success('Logged out successfully');
    router.push('/' as '/');
  };

  const isActive = (href: string) => {
    if (href === '/account') {
      return pathname === '/account';
    }
    return pathname.startsWith(href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600" />
          </button>
          <span className="font-semibold text-secondary-800">My Account</span>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary-500">FemmeLux</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {user?.firstName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-secondary-800 truncate">{getUserFullName(user)}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              {user?.businessName && (
                <div className="mt-3 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Business</p>
                  <p className="text-sm font-medium text-secondary-700 truncate">
                    {user.businessName}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      active
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-secondary-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200">
              <Link
                href="/products"
                className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-secondary-800 rounded-lg transition-colors mb-2"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                <span className="font-medium">Continue Shopping</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:min-h-0">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
