'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import {
  XMarkIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  InformationCircleIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { getBrands } from '@/lib/api/brands.api';
import { useAuth } from '@/hooks/useAuth';
import { SearchBar } from './SearchBar';
import type { Brand } from '@/types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user, isAuthenticated, logout } = useAuth();

  const { data: brandsData } = useQuery({
    queryKey: ['brands', 'active'],
    queryFn: () => getBrands({ limit: 10, isActive: true }),
  });

  const brands = brandsData?.data || [];

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </TransitionChild>

        {/* Slide-in panel */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-sm">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                      <Link
                        href="/"
                        onClick={onClose}
                        className="text-2xl font-bold text-primary-500"
                      >
                        FemmeLux
                      </Link>
                      <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Search */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <SearchBar onClose={onClose} isMobile />
                    </div>

                    {/* User Section */}
                    {isAuthenticated && user ? (
                      <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
                        <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.businessName && (
                          <p className="text-xs text-primary-600 mt-1">
                            {user.businessName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex gap-3">
                          <Link
                            href="/login"
                            onClick={onClose}
                            className="flex-1 btn btn-primary text-center"
                          >
                            Sign In
                          </Link>
                          <Link
                            href="/register"
                            onClick={onClose}
                            className="flex-1 btn btn-outline text-center"
                          >
                            Register
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Navigation Links */}
                    <nav className="flex-1 px-4 py-4">
                      <div className="space-y-1">
                        <Link
                          href="/"
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-lg transition-colors"
                        >
                          <HomeIcon className="h-5 w-5" />
                          Home
                        </Link>
                        <Link
                          href="/brands"
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-lg transition-colors"
                        >
                          <BuildingStorefrontIcon className="h-5 w-5" />
                          All Brands
                        </Link>
                        <Link
                          href="/products"
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-lg transition-colors"
                        >
                          <ShoppingBagIcon className="h-5 w-5" />
                          All Products
                        </Link>
                        <Link
                          href="/about"
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-lg transition-colors"
                        >
                          <InformationCircleIcon className="h-5 w-5" />
                          About Us
                        </Link>
                      </div>

                      {/* Brands */}
                      {brands.length > 0 && (
                        <div className="mt-6">
                          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Popular Brands
                          </h3>
                          <div className="mt-2 space-y-1">
                            {brands.slice(0, 6).map((brand: Brand) => (
                              <Link
                                key={brand.id}
                                href={`/brands/${brand.slug}` as '/'}
                                onClick={onClose}
                                className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-primary-600 rounded-lg transition-colors"
                              >
                                {brand.name}
                              </Link>
                            ))}
                            <Link
                              href="/brands"
                              onClick={onClose}
                              className="block px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              View all brands →
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Account Links */}
                      {isAuthenticated && (
                        <div className="mt-6">
                          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Account
                          </h3>
                          <div className="mt-2 space-y-1">
                            <Link
                              href="/account/orders"
                              onClick={onClose}
                              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-lg transition-colors"
                            >
                              <ClipboardDocumentListIcon className="h-5 w-5" />
                              My Orders
                            </Link>
                            <Link
                              href="/account/profile"
                              onClick={onClose}
                              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary-600 rounded-lg transition-colors"
                            >
                              <UserCircleIcon className="h-5 w-5" />
                              Profile Settings
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-error-600 rounded-lg transition-colors"
                            >
                              <ArrowRightOnRectangleIcon className="h-5 w-5" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </nav>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default MobileMenu;
