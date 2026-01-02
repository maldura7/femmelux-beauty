'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import type { Order, OrderStatus } from '@/lib/api/orders.api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  processing: { label: 'Processing', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  shipped: { label: 'Shipped', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  delivered: { label: 'Delivered', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const defaultStatus = { label: 'Unknown', color: 'text-gray-700', bgColor: 'bg-gray-100' };

export function OrderCard({ order }: OrderCardProps) {
  // Normalize status to lowercase to match config keys (backend returns uppercase)
  const normalizedStatus = order.status?.toLowerCase() as OrderStatus;
  const status = statusConfig[normalizedStatus] || defaultStatus;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const brandCount = new Set(order.items.map((item) => item.brand?.id).filter(Boolean)).size;

  return (
    <Link
      href={`/account/orders/${order.id}` as '/'}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all group"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Order Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
            <h3 className="font-semibold text-secondary-800">{order.orderNumber}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span>{formatDate(order.createdAt)}</span>
            <span className="hidden sm:inline">•</span>
            <span>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              {brandCount} {brandCount === 1 ? 'brand' : 'brands'}
            </span>
          </div>
        </div>

        {/* Total & Action */}
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-lg font-bold text-primary-600">{formatCurrency(order.total)}</p>
          </div>

          <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-primary-50 transition-colors">
            <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </div>
      </div>

      {/* Tracking Info (if shipped) */}
      {normalizedStatus === 'shipped' && order.trackingNumber && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Tracking:</span>{' '}
            <span className="font-mono text-primary-600">{order.trackingNumber}</span>
            {order.estimatedDelivery && (
              <span className="text-gray-400 ml-2">
                • Est. delivery: {formatDate(order.estimatedDelivery)}
              </span>
            )}
          </p>
        </div>
      )}
    </Link>
  );
}
