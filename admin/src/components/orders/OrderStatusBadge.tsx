'use client';

import {
  ClockIcon,
  CheckCircleIcon,
  CogIcon,
  TruckIcon,
  HomeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: 'Pending',
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-700',
    icon: ClockIcon,
  },
  confirmed: {
    label: 'Confirmed',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: CheckCircleIcon,
  },
  processing: {
    label: 'Processing',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: CogIcon,
  },
  shipped: {
    label: 'Shipped',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    icon: TruckIcon,
  },
  delivered: {
    label: 'Delivered',
    bgColor: 'bg-success-100',
    textColor: 'text-success-700',
    icon: HomeIcon,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-error-100',
    textColor: 'text-error-700',
    icon: XCircleIcon,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function OrderStatusBadge({
  status,
  size = 'md',
  showIcon = true,
}: OrderStatusBadgeProps) {
  // Normalize status to lowercase since backend returns UPPERCASE
  const normalizedStatus = (status?.toLowerCase() || 'pending') as OrderStatus;
  const config = statusConfig[normalizedStatus] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        config.bgColor,
        config.textColor,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon className={iconSizeClasses[size]} />}
      {config.label}
    </span>
  );
}

export function getStatusLabel(status: OrderStatus): string {
  const normalizedStatus = (status?.toLowerCase() || 'pending') as OrderStatus;
  return statusConfig[normalizedStatus]?.label || status;
}

export function getStatusColor(status: OrderStatus): string {
  const normalizedStatus = (status?.toLowerCase() || 'pending') as OrderStatus;
  return statusConfig[normalizedStatus]?.textColor || 'text-gray-700';
}

export default OrderStatusBadge;
