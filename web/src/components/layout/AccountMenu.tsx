'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { isApproved, isPending, isRejected, isGuest, getUserFullName } from '@/lib/auth';

interface AccountMenuProps {
  className?: string;
}

export function AccountMenu({ className = '' }: AccountMenuProps) {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={cn('p-2', className)}>
        <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <Menu as="div" className={cn('relative', className)}>
      <MenuButton className="flex items-center p-2 text-secondary-700 hover:text-primary-600 transition-colors focus:outline-none">
        <UserCircleIcon className="h-6 w-6" />
        {isAuthenticated && user && (
          <span className="hidden lg:block ml-2 text-sm font-medium max-w-[100px] truncate">
            {user.firstName}
          </span>
        )}
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
        <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 divide-y divide-gray-100">
          {isAuthenticated ? (
            <>
              {/* User Info */}
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900 truncate">{getUserFullName(user)}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {user?.businessName && (
                  <p className="text-xs text-primary-600 mt-1 truncate">
                    {user.businessName}
                  </p>
                )}
                {/* Account Status Badge */}
                {isPending(user) && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    <ClockIcon className="h-3 w-3" />
                    Pending Approval
                  </span>
                )}
                {isGuest(user) && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                    <DocumentTextIcon className="h-3 w-3" />
                    Apply for Access
                  </span>
                )}
              </div>

              {/* Application Status Link - for non-approved users */}
              {!isApproved(user) && (
                <div className="py-1">
                  {isPending(user) ? (
                    <MenuItem>
                      {({ focus }) => (
                        <Link
                          href="/account/application"
                          className={cn(
                            'flex items-center gap-3 px-4 py-2 text-sm',
                            focus ? 'bg-yellow-50 text-yellow-700' : 'text-yellow-600'
                          )}
                        >
                          <ClockIcon className="h-5 w-5" />
                          Application Status
                        </Link>
                      )}
                    </MenuItem>
                  ) : (isGuest(user) || isRejected(user)) && (
                    <MenuItem>
                      {({ focus }) => (
                        <Link
                          href="/account/apply"
                          className={cn(
                            'flex items-center gap-3 px-4 py-2 text-sm font-medium',
                            focus ? 'bg-primary-50 text-primary-700' : 'text-primary-600'
                          )}
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                          {isRejected(user) ? 'Reapply for Account' : 'Apply for Business Account'}
                        </Link>
                      )}
                    </MenuItem>
                  )}
                </div>
              )}

              {/* Menu Items - Only show orders for approved users */}
              <div className="py-1">
                {isApproved(user) && (
                  <MenuItem>
                    {({ focus }) => (
                      <Link
                        href="/account/orders"
                        className={cn(
                          'flex items-center gap-3 px-4 py-2 text-sm',
                          focus ? 'bg-gray-50 text-primary-600' : 'text-gray-700'
                        )}
                      >
                        <ClipboardDocumentListIcon className="h-5 w-5" />
                        My Orders
                      </Link>
                    )}
                  </MenuItem>
                )}
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      href="/account/profile"
                      className={cn(
                        'flex items-center gap-3 px-4 py-2 text-sm',
                        focus ? 'bg-gray-50 text-primary-600' : 'text-gray-700'
                      )}
                    >
                      <Cog6ToothIcon className="h-5 w-5" />
                      Account Settings
                    </Link>
                  )}
                </MenuItem>
              </div>

              {/* Logout */}
              <div className="py-1">
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={() => logout()}
                      className={cn(
                        'flex items-center gap-3 w-full px-4 py-2 text-sm',
                        focus ? 'bg-gray-50 text-error-600' : 'text-gray-700'
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Sign Out
                    </button>
                  )}
                </MenuItem>
              </div>
            </>
          ) : (
            <>
              {/* Guest Menu */}
              <div className="py-1">
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      href="/login"
                      className={cn(
                        'flex items-center gap-3 px-4 py-2 text-sm',
                        focus ? 'bg-gray-50 text-primary-600' : 'text-gray-700'
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Sign In
                    </Link>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      href="/register"
                      className={cn(
                        'flex items-center gap-3 px-4 py-2 text-sm',
                        focus ? 'bg-gray-50 text-primary-600' : 'text-gray-700'
                      )}
                    >
                      <UserPlusIcon className="h-5 w-5" />
                      Apply for Account
                    </Link>
                  )}
                </MenuItem>
              </div>
            </>
          )}
        </MenuItems>
      </Transition>
    </Menu>
  );
}

export default AccountMenu;
