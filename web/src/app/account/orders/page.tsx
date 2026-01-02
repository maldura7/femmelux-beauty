'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { getMyOrders, type OrderStatus } from '@/lib/api/orders.api';
import { OrderCard } from '@/components/account';

const statusOptions: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrdersListPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const limit = 10;

  // Fetch orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['my-orders', { page, limit, status: statusFilter || undefined }],
    queryFn: () =>
      getMyOrders({
        page,
        limit,
        status: statusFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
  });

  const orders = ordersData?.data || [];
  const pagination = ordersData?.pagination;
  const totalPages = pagination?.pages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">My Orders</h1>
          <p className="text-gray-500 mt-1">
            {pagination?.total || 0} total orders
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-3">
          <FunnelIcon className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | '');
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-white border border-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBagIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-800 mb-2">
            {statusFilter ? 'No orders found' : 'No orders yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {statusFilter
              ? `You don't have any ${statusFilter} orders.`
              : 'When you place orders, they will appear here.'}
          </p>
          {statusFilter ? (
            <button
              onClick={() => setStatusFilter('')}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-secondary-800 font-medium rounded-lg transition-colors"
            >
              Clear Filter
            </button>
          ) : (
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-medium rounded-lg transition-colors"
            >
              Start Shopping
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  page === pageNum
                    ? 'bg-primary-500 text-secondary-900'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
