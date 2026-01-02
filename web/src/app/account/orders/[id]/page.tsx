'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  TruckIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { getOrder, cancelOrder, type Order, type OrderStatus } from '@/lib/api/orders.api';
import { formatCurrency, formatDate, resolveImageUrl } from '@/lib/utils';
import { ReorderButton } from '@/components/account';
import toast from 'react-hot-toast';

const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: ClockIcon,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: CheckCircleIcon,
  },
  processing: {
    label: 'Processing',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: CubeIcon,
  },
  shipped: {
    label: 'Shipped',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    icon: TruckIcon,
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: CheckCircleIcon,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: XCircleIcon,
  },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch order
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel order');
    },
  });

  // Group items by brand
  const itemsByBrand = order?.items.reduce((acc, item) => {
    const brandId = item.brand?.id || 'unknown';
    if (!acc[brandId]) {
      acc[brandId] = {
        brand: item.brand || { id: 'unknown', name: 'Unknown Brand' },
        items: [],
      };
    }
    acc[brandId].items.push(item);
    return acc;
  }, {} as Record<string, { brand: { id: string; name: string }; items: typeof order.items }>);

  const canCancel = order?.status?.toLowerCase() === 'pending';
  const canTrack = order?.status?.toLowerCase() === 'shipped' && order.trackingNumber;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-64 bg-white border border-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircleIcon className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-secondary-800 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">
          The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-medium rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  // Normalize status to lowercase (API returns uppercase like 'PENDING', config uses lowercase 'pending')
  const normalizedStatus = order.status.toLowerCase() as OrderStatus;
  const status = statusConfig[normalizedStatus] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors mb-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-secondary-800">Order {order.orderNumber}</h1>
          <p className="text-gray-500 mt-1">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${status.bgColor}`}>
          <StatusIcon className={`w-5 h-5 ${status.color}`} />
          <span className={`font-medium ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <ReorderButton orderId={order.id} orderItems={order.items} />

        {canTrack && (
          <a
            href={`https://track.aftership.com/${order.trackingNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-secondary-800 font-medium rounded-lg transition-colors"
          >
            <TruckIcon className="w-5 h-5" />
            Track Shipment
          </a>
        )}

        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 font-medium rounded-lg transition-colors"
          >
            <XCircleIcon className="w-5 h-5" />
            Cancel Order
          </button>
        )}

        <button
          onClick={() => toast.success('Invoice download started')}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-secondary-800 font-medium rounded-lg transition-colors"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          Download Invoice
        </button>
      </div>

      {/* Tracking Info */}
      {order.trackingNumber && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TruckIcon className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">Shipment Tracking</p>
              <p className="text-sm text-blue-700">
                {order.carrier && `${order.carrier}: `}
                <span className="font-mono">{order.trackingNumber}</span>
                {order.estimatedDelivery && (
                  <span className="ml-2">
                    • Estimated delivery: {formatDate(order.estimatedDelivery)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-secondary-800 mb-4">Order Items</h2>

            <div className="space-y-6">
              {Object.values(itemsByBrand || {}).map(({ brand, items }) => (
                <div key={brand.id}>
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                    <span className="font-semibold text-secondary-700">{brand.name}</span>
                    <span className="text-xs text-gray-400">
                      ({items.length} {items.length === 1 ? 'item' : 'items'})
                    </span>
                  </div>

                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <Image
                              src={resolveImageUrl(item.productImage) || ''}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <CubeIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${item.productId}` as '/'}
                            className="font-medium text-secondary-800 hover:text-primary-600 transition-colors line-clamp-1"
                          >
                            {item.productName}
                          </Link>
                          <p className="text-sm text-gray-400 mt-0.5">SKU: {item.sku}</p>
                          {item.variantName && (
                            <p className="text-sm text-gray-500 mt-0.5">{item.variantName}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-gray-600">
                              {formatCurrency(item.price)} x {item.quantity}
                            </p>
                            <p className="font-medium text-secondary-800">
                              {formatCurrency(item.total)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-secondary-800 mb-4">Order Timeline</h2>

              <div className="relative">
                {order.statusHistory.map((entry, index) => {
                  const normalizedEntryStatus = entry.status.toLowerCase() as OrderStatus;
                  const entryStatus = statusConfig[normalizedEntryStatus] || statusConfig.pending;
                  const EntryIcon = entryStatus.icon;
                  const isLast = index === order.statusHistory.length - 1;

                  return (
                    <div key={index} className="flex gap-4 pb-6 relative">
                      {/* Connector Line */}
                      {!isLast && (
                        <div className="absolute left-[19px] top-10 w-0.5 h-full bg-gray-200" />
                      )}

                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${entryStatus.bgColor}`}
                      >
                        <EntryIcon className={`w-5 h-5 ${entryStatus.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <p className={`font-medium ${entryStatus.color}`}>{entryStatus.label}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(entry.timestamp, true)}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-secondary-800 mb-4">Order Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-secondary-800">Total</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Payment Status</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : order.paymentStatus === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : order.paymentStatus === 'refunded'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-secondary-800 mb-4">Shipping Address</h2>
            <div className="text-gray-600 space-y-1">
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-secondary-800 mb-4">Billing Address</h2>
            <div className="text-gray-600 space-y-1">
              <p>{order.billingAddress.street}</p>
              <p>
                {order.billingAddress.city}, {order.billingAddress.state}{' '}
                {order.billingAddress.postalCode}
              </p>
              <p>{order.billingAddress.country}</p>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-secondary-800 mb-4">Order Notes</h2>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-secondary-800 mb-2">Cancel Order</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                placeholder="Why are you cancelling this order?"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 px-4 border border-gray-200 hover:bg-gray-50 text-secondary-800 font-medium rounded-lg transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
