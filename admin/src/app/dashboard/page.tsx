'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  UsersIcon,
  CubeIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  StatCard,
  SalesChart,
  OrdersStatusChart,
  RecentOrdersTable,
  TopProductsTable,
  PendingApplicationsWidget,
} from '@/components/dashboard';
import {
  getDashboardStats,
  getSalesOverTime,
  getOrdersByStatus,
  getTopProducts
} from '@/lib/api/analytics.api';
import { getRecentOrders } from '@/lib/api/orders.api';
import {
  getAllApplications,
  approveApplication,
  rejectApplication,
  Application,
} from '@/lib/api/applications.api';
import { ApproveApplicationModal, RejectApplicationModal } from '@/components/applications';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const queryClient = useQueryClient();

  // Modal states
  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    application: Application | null;
  }>({ isOpen: false, application: null });

  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    application: Application | null;
  }>({ isOpen: false, application: null });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
    retry: false,
  });

  // Fetch sales data (last 30 days)
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-over-time'],
    queryFn: () => getSalesOverTime({ period: 'day' }),
    retry: false,
  });

  // Fetch orders by status
  const { data: ordersStatusData, isLoading: statusLoading } = useQuery({
    queryKey: ['orders-by-status'],
    queryFn: () => getOrdersByStatus(),
    retry: false,
  });

  // Fetch recent orders
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => getRecentOrders(5),
    retry: false,
  });

  // Fetch top products
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => getTopProducts(5),
    retry: false,
  });

  // Fetch pending applications
  const { data: pendingApplicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['pending-applications'],
    queryFn: () => getAllApplications({ status: 'PENDING', limit: 5 }),
    retry: false,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      approveApplication(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application approved successfully');
      setApproveModal({ isOpen: false, application: null });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve application');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectApplication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application rejected');
      setRejectModal({ isOpen: false, application: null });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject application');
    },
  });

  const pendingApplications = pendingApplicationsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : '$0'}
          change={stats?.revenueChange}
          changeLabel="vs last month"
          icon={<CurrencyDollarIcon className="h-6 w-6 text-primary-600" />}
          iconBgColor="bg-primary-100"
          linkHref="/orders"
          linkLabel="View orders"
          isLoading={statsLoading}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders?.toLocaleString() || '0'}
          change={stats?.ordersChange}
          changeLabel="vs last month"
          icon={<ShoppingCartIcon className="h-6 w-6 text-blue-600" />}
          iconBgColor="bg-blue-100"
          linkHref="/orders"
          linkLabel="View orders"
          isLoading={statsLoading}
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers?.toLocaleString() || '0'}
          change={stats?.customersChange}
          changeLabel="vs last month"
          icon={<UsersIcon className="h-6 w-6 text-green-600" />}
          iconBgColor="bg-green-100"
          linkHref="/customers"
          linkLabel="View customers"
          isLoading={statsLoading}
        />
        <StatCard
          title="Active Products"
          value={stats?.totalProducts?.toLocaleString() || '0'}
          change={stats?.productsChange}
          changeLabel="vs last month"
          icon={<CubeIcon className="h-6 w-6 text-purple-600" />}
          iconBgColor="bg-purple-100"
          linkHref="/products"
          linkLabel="View products"
          isLoading={statsLoading}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Average Order Value"
          value={stats ? formatCurrency(stats.averageOrderValue) : '$0'}
          change={stats?.aovChange}
          changeLabel="vs last month"
          icon={<ArrowTrendingUpIcon className="h-6 w-6 text-indigo-600" />}
          iconBgColor="bg-indigo-100"
          isLoading={statsLoading}
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders?.toLocaleString() || '0'}
          icon={<ClockIcon className="h-6 w-6 text-amber-600" />}
          iconBgColor="bg-amber-100"
          linkHref="/dashboard/orders?status=pending"
          linkLabel="View pending"
          isLoading={statsLoading}
        />
        <StatCard
          title="Pending Applications"
          value={pendingApplications.length.toString()}
          icon={<DocumentTextIcon className="h-6 w-6 text-yellow-600" />}
          iconBgColor="bg-yellow-100"
          linkHref="/dashboard/applications?status=PENDING"
          linkLabel="Review applications"
          isLoading={applicationsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <SalesChart
            data={salesData || []}
            title="Sales Over Time"
            isLoading={salesLoading}
          />
        </div>

        {/* Orders Status Pie Chart */}
        <div className="lg:col-span-1">
          <OrdersStatusChart
            data={ordersStatusData || []}
            title="Orders by Status"
            isLoading={statusLoading}
          />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <RecentOrdersTable
          orders={recentOrders || []}
          isLoading={ordersLoading}
          maxItems={5}
        />

        {/* Top Products */}
        <TopProductsTable
          products={topProducts || []}
          isLoading={productsLoading}
          maxItems={5}
        />
      </div>

      {/* Pending Applications Widget */}
      {(pendingApplications.length > 0 || applicationsLoading) && (
        <PendingApplicationsWidget
          applications={pendingApplications}
          isLoading={applicationsLoading}
          maxItems={5}
          onApprove={(application) => setApproveModal({ isOpen: true, application })}
          onReject={(application) => setRejectModal({ isOpen: true, application })}
        />
      )}

      {/* Approve Modal */}
      <ApproveApplicationModal
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ isOpen: false, application: null })}
        application={approveModal.application}
        onConfirm={async (notes, sendEmail) => {
          if (approveModal.application) {
            await approveMutation.mutateAsync({
              id: approveModal.application.id,
              notes,
            });
          }
        }}
        isLoading={approveMutation.isPending}
      />

      {/* Reject Modal */}
      <RejectApplicationModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, application: null })}
        application={rejectModal.application}
        onConfirm={async (reason, sendEmail) => {
          if (rejectModal.application) {
            await rejectMutation.mutateAsync({
              id: rejectModal.application.id,
              reason,
            });
          }
        }}
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
}
