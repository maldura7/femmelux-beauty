'use client';

import Link from 'next/link';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { OrderStatusBadge } from '@/components/orders';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/types';

interface RecentOrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
  maxItems?: number;
}

export function RecentOrdersTable({
  orders,
  isLoading = false,
  maxItems = 5,
}: RecentOrdersTableProps) {
  const displayOrders = orders.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[...Array(maxItems)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                  <div className="h-3 w-32 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-200 animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            No orders found
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <Link
          href="/orders"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all →
        </Link>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm text-gray-900">
                      {order.customer?.businessName || `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.customer?.email || ''}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <OrderStatusBadge status={(order.status?.toLowerCase() || 'pending') as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'} size="sm" showIcon={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

export default RecentOrdersTable;
