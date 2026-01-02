'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  ChevronDownIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { getBrands } from '@/lib/api/brands.api';
import { SearchBar } from './SearchBar';
import { CartIcon } from './CartIcon';
import { AccountMenu } from './AccountMenu';
import { BrandBar } from './BrandBar';
import { MobileMenu } from './MobileMenu';
import { cn } from '@/lib/utils';
import type { Brand } from '@/types';

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch brands for dropdown
  const { data: brandsData } = useQuery({
    queryKey: ['brands', 'nav'],
    queryFn: () => getBrands({ limit: 12, isActive: true }),
  });

  const brands = brandsData?.data || [];

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 bg-white transition-shadow duration-200',
          isScrolled && 'shadow-md'
        )}
      >
        {/* Main Header */}
        <div className="border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16 lg:h-20">
              {/* Left: Mobile Menu + Logo */}
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-gray-600 hover:text-primary-600"
                  aria-label="Open menu"
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>

                {/* Logo */}
                <Link href="/" className="flex items-center">
                  <span className="text-2xl lg:text-3xl font-bold text-primary-500">
                    FemmeLux
                  </span>
                  <span className="hidden sm:inline text-lg lg:text-xl font-light text-secondary-600 ml-1">
                    Beauty
                  </span>
                </Link>
              </div>

              {/* Center: Search Bar (Desktop) */}
              <div className="hidden lg:block flex-1 max-w-xl mx-8">
                <SearchBar />
              </div>

              {/* Right: Cart + Account */}
              <div className="flex items-center gap-2">
                <CartIcon />
                <AccountMenu />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar (Desktop) */}
        <nav className="hidden lg:block border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-8 h-12">
              {/* Shop by Brand Dropdown */}
              <Menu as="div" className="relative">
                <MenuButton
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium transition-colors',
                    isActive('/brands')
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  )}
                >
                  <BuildingStorefrontIcon className="h-4 w-4" />
                  Shop by Brand
                  <ChevronDownIcon className="h-4 w-4" />
                </MenuButton>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute left-0 mt-2 w-64 origin-top-left bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-96 overflow-y-auto">
                    <div className="py-2">
                      {brands.map((brand: Brand) => (
                        <MenuItem key={brand.id}>
                          {({ focus }) => (
                            <Link
                              href={`/brands/${brand.slug}` as '/'}
                              className={cn(
                                'block px-4 py-2 text-sm',
                                focus ? 'bg-gray-50 text-primary-600' : 'text-gray-700'
                              )}
                            >
                              {brand.name}
                            </Link>
                          )}
                        </MenuItem>
                      ))}
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <MenuItem>
                          {({ focus }) => (
                            <Link
                              href="/brands"
                              className={cn(
                                'block px-4 py-2 text-sm font-medium',
                                focus ? 'bg-gray-50 text-primary-600' : 'text-primary-600'
                              )}
                            >
                              View All Brands →
                            </Link>
                          )}
                        </MenuItem>
                      </div>
                    </div>
                  </MenuItems>
                </Transition>
              </Menu>

              {/* All Products */}
              <Link
                href="/products"
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive('/products')
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                )}
              >
                All Products
              </Link>

              {/* About */}
              <Link
                href="/about"
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive('/about')
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                )}
              >
                About
              </Link>
            </div>
          </div>
        </nav>

        {/* Brand Bar */}
        <BrandBar />
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}

export default Header;
