'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { LoadingScreen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { isAuthenticated as checkAuth } from '@/lib/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check auth on mount
  useEffect(() => {
    setMounted(true);

    // Quick client-side auth check before React Query loads
    if (!checkAuth()) {
      router.replace('/login');
    }
  }, [router]);

  // Redirect if not authenticated after loading
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  // Show loading while checking auth or not mounted
  if (!mounted || isLoading) {
    return <LoadingScreen />;
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - mobile and desktop */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} FemmeLux Beauty. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
