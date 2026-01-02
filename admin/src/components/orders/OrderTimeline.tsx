'use client';

import {
  ClockIcon,
  CheckCircleIcon,
  CogIcon,
  TruckIcon,
  HomeIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import type { OrderStatus } from './OrderStatusBadge';

interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  statusHistory?: StatusHistoryItem[];
  orientation?: 'horizontal' | 'vertical';
}

const orderFlow: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    activeColor: string;
    completedColor: string;
  }
> = {
  pending: {
    label: 'Pending',
    description: 'Order placed, awaiting confirmation',
    icon: ClockIcon,
    activeColor: 'text-warning-500 bg-warning-100 border-warning-500',
    completedColor: 'text-white bg-warning-500 border-warning-500',
  },
  confirmed: {
    label: 'Confirmed',
    description: 'Order confirmed by seller',
    icon: CheckCircleIcon,
    activeColor: 'text-blue-500 bg-blue-100 border-blue-500',
    completedColor: 'text-white bg-blue-500 border-blue-500',
  },
  processing: {
    label: 'Processing',
    description: 'Order is being prepared',
    icon: CogIcon,
    activeColor: 'text-purple-500 bg-purple-100 border-purple-500',
    completedColor: 'text-white bg-purple-500 border-purple-500',
  },
  shipped: {
    label: 'Shipped',
    description: 'Order has been shipped',
    icon: TruckIcon,
    activeColor: 'text-orange-500 bg-orange-100 border-orange-500',
    completedColor: 'text-white bg-orange-500 border-orange-500',
  },
  delivered: {
    label: 'Delivered',
    description: 'Order delivered successfully',
    icon: HomeIcon,
    activeColor: 'text-success-500 bg-success-100 border-success-500',
    completedColor: 'text-white bg-success-500 border-success-500',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Order has been cancelled',
    icon: XCircleIcon,
    activeColor: 'text-error-500 bg-error-100 border-error-500',
    completedColor: 'text-white bg-error-500 border-error-500',
  },
};

export function OrderTimeline({
  currentStatus,
  statusHistory = [],
  orientation = 'horizontal',
}: OrderTimelineProps) {
  // Handle cancelled status separately
  if (currentStatus === 'cancelled') {
    const config = statusConfig.cancelled;
    const Icon = config.icon;
    const cancelledEntry = statusHistory.find((h) => h.status === 'cancelled');

    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center border-2',
            config.completedColor
          )}
        >
          <Icon className="h-8 w-8" />
        </div>
        <p className="mt-3 text-lg font-medium text-error-600">Order Cancelled</p>
        {cancelledEntry && (
          <p className="mt-1 text-sm text-gray-500">
            {new Date(cancelledEntry.timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
        {cancelledEntry?.note && (
          <p className="mt-2 text-sm text-gray-600 max-w-md text-center">
            {cancelledEntry.note}
          </p>
        )}
      </div>
    );
  }

  const currentIndex = orderFlow.indexOf(currentStatus);

  // Get timestamp for a specific status from history
  const getStatusTimestamp = (status: OrderStatus): string | undefined => {
    const entry = statusHistory.find((h) => h.status === status);
    return entry?.timestamp;
  };

  if (orientation === 'vertical') {
    return (
      <div className="relative">
        {orderFlow.map((status, index) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          const timestamp = getStatusTimestamp(status);

          return (
            <div key={status} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Connector line */}
              {index < orderFlow.length - 1 && (
                <div
                  className={cn(
                    'absolute left-5 top-10 w-0.5 h-full -ml-px',
                    isCompleted ? 'bg-primary-500' : 'bg-gray-200'
                  )}
                />
              )}

              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0',
                  isCompleted && config.completedColor,
                  isCurrent && config.activeColor,
                  isUpcoming && 'bg-gray-100 border-gray-300 text-gray-400'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1.5">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCompleted || isCurrent ? 'text-secondary-800' : 'text-gray-400'
                  )}
                >
                  {config.label}
                </p>
                <p
                  className={cn(
                    'text-xs',
                    isCompleted || isCurrent ? 'text-gray-500' : 'text-gray-400'
                  )}
                >
                  {config.description}
                </p>
                {timestamp && (isCompleted || isCurrent) && (
                  <p className="text-xs text-primary-600 mt-1">
                    {new Date(timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal timeline (default)
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {orderFlow.map((status, index) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          const timestamp = getStatusTimestamp(status);
          const isLast = index === orderFlow.length - 1;

          return (
            <div key={status} className="flex items-center flex-1 last:flex-none">
              {/* Step */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                    isCompleted && config.completedColor,
                    isCurrent && config.activeColor,
                    isUpcoming && 'bg-gray-100 border-gray-300 text-gray-400'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p
                  className={cn(
                    'mt-2 text-xs font-medium text-center',
                    isCompleted || isCurrent ? 'text-secondary-800' : 'text-gray-400'
                  )}
                >
                  {config.label}
                </p>
                {timestamp && (isCompleted || isCurrent) && (
                  <p className="text-xs text-gray-500 text-center">
                    {new Date(timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>

              {/* Connector */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2',
                    isCompleted ? 'bg-primary-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderTimeline;
