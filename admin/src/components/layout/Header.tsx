'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui';

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Page title (desktop) */}
        {title && (
          <div className="hidden lg:flex lg:items-center">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>
        )}

        {/* Search */}
        <form className="relative flex flex-1 items-center" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <div className="relative w-full max-w-md">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="search-field"
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:ring-1 focus:ring-primary-500 sm:text-sm"
              placeholder="Search products, orders, customers..."
              type="search"
              name="search"
            />
          </div>
        </form>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" aria-hidden="true" />
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-error-500 ring-2 ring-white" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-x-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="sr-only">Open user menu</span>
              <Avatar
                name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                size="sm"
              />
              <span className="hidden lg:flex lg:items-center gap-x-1">
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName}
                </span>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </span>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-lg bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                    {user?.role}
                  </span>
                </div>

                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/dashboard/settings"
                        className={cn(
                          'block px-4 py-2 text-sm text-gray-700',
                          active && 'bg-gray-50'
                        )}
                      >
                        Your profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/dashboard/settings"
                        className={cn(
                          'block px-4 py-2 text-sm text-gray-700',
                          active && 'bg-gray-50'
                        )}
                      >
                        Settings
                      </Link>
                    )}
                  </Menu.Item>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => logout()}
                        disabled={isLoggingOut}
                        className={cn(
                          'block w-full text-left px-4 py-2 text-sm text-gray-700',
                          active && 'bg-gray-50',
                          isLoggingOut && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {isLoggingOut ? 'Signing out...' : 'Sign out'}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}

export default Header;
