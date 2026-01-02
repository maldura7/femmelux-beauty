'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  getDashboardStats,
  getSalesOverTime,
  getOrdersByStatus,
  getTopProducts,
  getTopBrands,
  getTopCustomers,
  getRevenueByBrand,
  exportAnalyticsReport,
  type AnalyticsFilters,
} from '@/lib/api/analytics.api';
import { getAllBrands } from '@/lib/api/brands.api';
import {
  StatCard,
  SalesChart,
  OrdersStatusChart,
  TopProductsTable,
} from '@/components/dashboard';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: 'month',
  });
  const [isExporting, setIsExporting] = useState(false);

  // Fetch brands for filter
  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => getAllBrands({ limit: 100 }),
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-stats', filters],
    queryFn: () => getDashboardStats(filters),
  });

  // Fetch sales data
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['analytics-sales', filters],
    queryFn: () => getSalesOverTime(filters),
  });

  // Fetch orders by status
  const { data: ordersStatusData, isLoading: statusLoading } = useQuery({
    queryKey: ['analytics-orders-status', filters],
    queryFn: () => getOrdersByStatus(filters),
  });

  // Fetch top products
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['analytics-top-products', filters],
    queryFn: () => getTopProducts(10, filters),
  });

  // Fetch top brands
  const { data: topBrands, isLoading: brandsLoading } = useQuery({
    queryKey: ['analytics-top-brands', filters],
    queryFn: () => getTopBrands(10, filters),
  });

  // Fetch top customers
  const { data: topCustomers, isLoading: customersLoading } = useQuery({
    queryKey: ['analytics-top-customers', filters],
    queryFn: () => getTopCustomers(10, filters),
  });

  // Fetch revenue by brand
  const { data: revenueByBrand, isLoading: revenueLoading } = useQuery({
    queryKey: ['analytics-revenue-by-brand', filters],
    queryFn: () => getRevenueByBrand(filters),
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportAnalyticsReport(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report exported successfully');
    } catch {
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800 flex items-center gap-2">
            <ChartBarIcon className="h-7 w-7 text-primary-600" />
            Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Detailed insights and performance metrics for your store.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value as AnalyticsFilters['period'] })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>

          {/* Brand Filter */}
          <select
            value={filters.brandId || ''}
            onChange={(e) => setFilters({ ...filters, brandId: e.target.value || undefined })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Brands</option>
            {brandsData?.brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : '$0'}
          change={stats?.revenueChange}
          changeLabel="vs previous period"
          isLoading={statsLoading}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders?.toLocaleString() || '0'}
          change={stats?.ordersChange}
          changeLabel="vs previous period"
          isLoading={statsLoading}
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers?.toLocaleString() || '0'}
          change={stats?.customersChange}
          changeLabel="vs previous period"
          isLoading={statsLoading}
        />
        <StatCard
          title="Avg. Order Value"
          value={stats ? formatCurrency(stats.averageOrderValue) : '$0'}
          change={stats?.aovChange}
          changeLabel="vs previous period"
          isLoading={statsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart
            data={salesData || []}
            title="Revenue & Orders Over Time"
            isLoading={salesLoading}
          />
        </div>
        <div className="lg:col-span-1">
          <OrdersStatusChart
            data={ordersStatusData || []}
            title="Orders by Status"
            isLoading={statusLoading}
          />
        </div>
      </div>

      {/* Revenue by Brand */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-secondary-800 mb-4">Revenue by Brand</h2>
        {revenueLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded" />
            ))}
          </div>
        ) : revenueByBrand && revenueByBrand.length > 0 ? (
          <div className="space-y-3">
            {revenueByBrand.map((brand, index) => {
              const maxRevenue = Math.max(...revenueByBrand.map(b => b.revenue));
              const percentage = maxRevenue > 0 ? (brand.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={brand.brandId || index} className="flex items-center gap-4">
                  <span className="w-32 text-sm font-medium text-gray-700 truncate">
                    {brand.brandName}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4">
                    <div
                      className="bg-primary-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-24 text-sm font-semibold text-right">
                    {formatCurrency(brand.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No data available</p>
        )}
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <TopProductsTable
          products={topProducts || []}
          isLoading={productsLoading}
          maxItems={10}
        />
      </div>

      {/* Top Brands & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Brands */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-secondary-800 mb-4">Top Brands</h2>
          {brandsLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          ) : topBrands && topBrands.length > 0 ? (
            <div className="space-y-3">
              {topBrands.map((brand, index) => (
                <div key={brand.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-700">{brand.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-secondary-800">{formatCurrency(brand.revenue)}</p>
                    <p className="text-xs text-gray-500">{brand.totalOrders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-secondary-800 mb-4">Top Customers</h2>
          {customersLoading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded" />
              ))}
            </div>
          ) : topCustomers && topCustomers.length > 0 ? (
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-700">{customer.businessName}</p>
                      <p className="text-xs text-gray-500">{customer.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-secondary-800">{formatCurrency(customer.totalSpent)}</p>
                    <p className="text-xs text-gray-500">{customer.totalOrders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
