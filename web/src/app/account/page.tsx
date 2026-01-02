'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowRightIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { getStoredUser, type User } from '@/lib/auth';
import { getMyOrders } from '@/lib/api/orders.api';
import { formatCurrency } from '@/lib/utils';
import { OrderCard } from '@/components/account';

export default function AccountDashboard() {
  const user = getStoredUser();

  // Fetch recent orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders', { limit: 5 }],
    queryFn: () => getMyOrders({ limit: 5 }),
  });

  // Calculate stats
  const totalOrders = ordersData?.pagination.total || 0;
  const totalSpent = ordersData?.data.reduce((sum, order) => sum + order.total, 0) || 0;
  const pendingOrders =
    ordersData?.data.filter((order) => ['pending', 'confirmed', 'processing'].includes(order.status))
      .length || 0;

  const stats = [
    {
      label: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingBagIcon,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Spent',
      value: formatCurrency(totalSpent),
      icon: CurrencyDollarIcon,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Pending Orders',
      value: pendingOrders.toString(),
      icon: ClockIcon,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-400 rounded-2xl p-6 md:p-8 text-secondary-900">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <p className="text-secondary-800/80">
          Manage your orders, track shipments, and update your profile from your account dashboard.
        </p>

        {user?.customer && !user.customer.isApproved && (
          <div className="mt-4 p-4 bg-white/20 rounded-lg">
            <p className="text-sm font-medium">
              Your wholesale account is pending approval. You&apos;ll receive an email once it&apos;s
              verified.
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-secondary-800">
                  {ordersLoading ? (
                    <span className="inline-block w-16 h-6 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/account/orders"
          className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-primary-50 transition-colors">
              <ShoppingBagIcon className="w-6 h-6 text-gray-600 group-hover:text-primary-600 transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-secondary-800">View All Orders</p>
              <p className="text-sm text-gray-500">Track and manage your orders</p>
            </div>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </Link>

        <Link
          href="/account/profile"
          className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-primary-50 transition-colors">
              <UserIcon className="w-6 h-6 text-gray-600 group-hover:text-primary-600 transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-secondary-800">Edit Profile</p>
              <p className="text-sm text-gray-500">Update your account details</p>
            </div>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-secondary-800">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            View All
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : ordersData?.data && ordersData.data.length > 0 ? (
          <div className="space-y-4">
            {ordersData.data.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-secondary-800 mb-1">No orders yet</h3>
            <p className="text-gray-500 text-sm mb-4">
              Start shopping to see your orders here
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-medium rounded-lg transition-colors"
            >
              Browse Products
            </Link>
          </div>
        )}
      </div>

      {/* Business Info */}
      {user?.customer && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-secondary-800 mb-4">Business Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Business Name</p>
              <p className="font-medium text-secondary-800">{user.customer.businessName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Business Type</p>
              <p className="font-medium text-secondary-800">{user.customer.businessType}</p>
            </div>
            {user.customer.taxId && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Tax ID</p>
                <p className="font-medium text-secondary-800">{user.customer.taxId}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Account Status</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.customer.isApproved
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {user.customer.isApproved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
