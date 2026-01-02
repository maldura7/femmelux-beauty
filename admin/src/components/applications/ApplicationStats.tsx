'use client';

import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { ApplicationStats as Stats } from '@/lib/api/applications.api';

// ============================================
// TYPES
// ============================================

interface ApplicationStatsProps {
  stats: Stats | undefined;
  isLoading?: boolean;
}

// ============================================
// STAT CARD COMPONENT
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  isLoading?: boolean;
  highlight?: boolean;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  bgColor,
  isLoading,
  highlight,
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border p-6 ${
        highlight ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-16 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className={`mt-2 text-3xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>
              {value}
            </p>
          )}
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// APPLICATION STATS COMPONENT
// ============================================

export default function ApplicationStats({ stats, isLoading }: ApplicationStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Applications"
        value={stats?.total || 0}
        subtitle="All time"
        icon={DocumentTextIcon}
        iconColor="text-blue-600"
        bgColor="bg-blue-100"
        isLoading={isLoading}
      />

      <StatCard
        title="Pending Review"
        value={stats?.pending || 0}
        subtitle="Needs attention"
        icon={ClockIcon}
        iconColor="text-yellow-600"
        bgColor="bg-yellow-100"
        isLoading={isLoading}
        highlight={(stats?.pending || 0) > 0}
      />

      <StatCard
        title="Approved This Month"
        value={stats?.approvedThisMonth || 0}
        subtitle={`${stats?.approved || 0} total approved`}
        icon={CheckCircleIcon}
        iconColor="text-green-600"
        bgColor="bg-green-100"
        isLoading={isLoading}
      />

      <StatCard
        title="Rejection Rate"
        value={`${(stats?.rejectionRate || 0).toFixed(1)}%`}
        subtitle={`${stats?.rejected || 0} rejected`}
        icon={XCircleIcon}
        iconColor="text-red-600"
        bgColor="bg-red-100"
        isLoading={isLoading}
      />
    </div>
  );
}
