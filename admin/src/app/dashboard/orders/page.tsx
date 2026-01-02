'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  EyeIcon,
  DocumentArrowDownIcon,
  ShoppingCartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { Card, CardBody, Button, Badge, Spinner } from '@/components/ui';
import { OrderFilters, OrderFiltersState } from '@/components/orders/OrderFilters';
import { OrderStatusBadge, OrderStatus } from '@/components/orders/OrderStatusBadge';
import { getAllOrders } from '@/lib/api/orders.api';
import { getAllBrands } from '@/lib/api/brands.api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order, Brand } from '@/types';

const ITEMS_PER_PAGE = 10;

// Payment status badge helper
const getPaymentBadge = (status: string) => {
  const variants: Record<string, 'warning' | 'success' | 'error'> = {
    pending: 'warning',
    paid: 'success',
    failed: 'error',
    refunded: 'error',
  };
  const labels: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    refunded: 'Refunded',
  };
  return (
    <Badge variant={variants[status?.toLowerCase()] || 'warning'}>
      {labels[status?.toLowerCase()] || status}
    </Badge>
  );
};

// Export to CSV function
const exportToCSV = (orders: Order[]) => {
  const headers = ['Order ID', 'Customer', 'Email', 'Total', 'Status', 'Payment Status', 'Date'];
  const rows = orders.map((order) => {
    const user = getOrderUser(order);
    return [
      order.orderNumber || order.id,
      (user?.firstName || '') + ' ' + (user?.lastName || ''),
      user?.email || '',
      order.total,
      order.status,
      order.paymentStatus,
      order.createdAt,
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell || ''}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper to get user info - handles both 'user' and 'customer' field names
const getOrderUser = (order: Order) => {
  return (order as Order & { user?: Order['customer'] }).user || order.customer;
};

export default function OrdersPage() {
  const router = useRouter();

  const [filters, setFilters] = useState<OrderFiltersState>({
    search: '',
    status: '',
    brandId: '',
    dateFrom: '',
    dateTo: '',
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Fetch brands for filter dropdown
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getAllBrands(),
  });

  const brands: Brand[] = brandsData?.data || [];

  // Fetch orders with filters
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ['orders', filters, currentPage],
    queryFn: () =>
      getAllOrders({
        search: filters.search || undefined,
        status: filters.status || undefined,
        brandId: filters.brandId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      }),
  });

  const orders: Order[] = ordersData?.data || [];
  const pagination = ordersData?.pagination || {
    total: 0,
    pages: 1,
    page: 1,
    limit: ITEMS_PER_PAGE,
  };

  const handleFilterChange = useCallback((newFilters: OrderFiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate stats from current page (ideally from API)
  // Normalize status to lowercase since backend returns UPPERCASE
  const stats = {
    total: pagination.total,
    pending: orders.filter((o) => o.status?.toLowerCase() === 'pending').length,
    processing: orders.filter((o) => ['confirmed', 'processing'].includes(o.status?.toLowerCase())).length,
    shipped: orders.filter((o) => o.status?.toLowerCase() === 'shipped').length,
    delivered: orders.filter((o) => o.status?.toLowerCase() === 'delivered').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-error-500">Failed to load orders</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Orders</h1>
          <p className="text-gray-600">Manage and track customer orders</p>
        </div>
        <Button variant="outline" onClick={() => exportToCSV(orders)}>
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-secondary-800">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Orders</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-purple-600">{stats.processing}</p>
            <p className="text-sm text-gray-500">Processing</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-orange-600">{stats.shipped}</p>
            <p className="text-sm text-gray-500">Shipped</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-success-600">{stats.delivered}</p>
            <p className="text-sm text-gray-500">Delivered</p>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <OrderFilters
            brands={brands}
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </CardBody>
      </Card>

      {/* Orders table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <ShoppingCartIcon className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-2">
                        {filters.search || filters.status || filters.brandId || filters.dateFrom
                          ? 'No orders found matching your filters.'
                          : 'No orders yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td>
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="font-medium font-mono text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {order.orderNumber || order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-secondary-800">
                          {getOrderUser(order)?.firstName} {getOrderUser(order)?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{getOrderUser(order)?.email}</p>
                        {getOrderUser(order)?.businessName && (
                          <p className="text-xs text-gray-400">{getOrderUser(order)?.businessName}</p>
                        )}
                      </div>
                    </td>
                    <td className="font-medium text-secondary-800">
                      {formatCurrency(order.total || 0)}
                    </td>
                    <td>
                      <OrderStatusBadge status={order.status as OrderStatus} size="sm" />
                    </td>
                    <td>{getPaymentBadge(order.paymentStatus)}</td>
                    <td className="text-gray-500 text-sm">
                      {order.createdAt ? formatDateTime(order.createdAt) : '—'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)} of {pagination.total}{' '}
              orders
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((page) => {
                  if (page === 1 || page === pagination.pages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;

                  return (
                    <div key={page} className="flex items-center gap-2">
                      {showEllipsis && <span className="text-gray-400">...</span>}
                      <Button
                        variant={page === currentPage ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[36px]"
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
