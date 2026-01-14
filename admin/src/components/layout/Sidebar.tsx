'use client';

import { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ClipboardDocumentListIcon,
  PhotoIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui';
import { getPath, getBasePath } from '@/lib/navigation';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Applications', href: '/dashboard/applications', icon: DocumentTextIcon },
  { name: 'Brands', href: '/dashboard/brands', icon: BuildingStorefrontIcon },
  { name: 'Products', href: '/dashboard/products', icon: CubeIcon },
  { name: 'Inventory', href: '/dashboard/inventory', icon: ClipboardDocumentListIcon },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCartIcon },
  { name: 'Customers', href: '/dashboard/users', icon: UsersIcon },
  { name: 'Messages', href: '/dashboard/messages', icon: EnvelopeIcon },
  { name: 'Import', href: '/dashboard/import', icon: DocumentArrowUpIcon },
  { name: 'Image Scraper', href: '/dashboard/image-scraper', icon: PhotoIcon },
  { name: 'Bulk Image Search', href: '/dashboard/bulk-images', icon: SparklesIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

interface SidebarContentProps {
  onClose?: () => void;
}

function SidebarContent({ onClose }: SidebarContentProps) {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useAuth();
  const basePath = getBasePath();

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  // Check if path is active - need to account for base path in pathname
  const isPathActive = (href: string) => {
    // Remove base path from pathname for comparison
    const normalizedPathname = pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || '/'
      : pathname;

    return (
      normalizedPathname === href ||
      (href !== '/dashboard' && normalizedPathname.startsWith(`${href}/`))
    );
  };

  return (
    <div className="flex h-full flex-col bg-secondary-800">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-secondary-700">
        <Logo size="sm" variant="white" href={getPath('/dashboard')} />
        {onClose && (
          <button
            type="button"
            className="lg:hidden -mr-2 p-2 text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = isPathActive(item.href);

          return (
            <a
              key={item.name}
              href={getPath(item.href)}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200',
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-300 hover:bg-secondary-700 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-medium rounded-full bg-primary-500 text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-secondary-700 p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium flex-shrink-0">
            {user?.firstName?.charAt(0) || 'U'}
            {user?.lastName?.charAt(0) || ''}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-secondary-700 hover:text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose || (() => {})}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <SidebarContent onClose={onClose} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </aside>
    </>
  );
}

export default Sidebar;
