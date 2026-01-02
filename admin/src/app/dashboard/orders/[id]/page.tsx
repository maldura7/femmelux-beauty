'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PrinterIcon,
  EnvelopeIcon,
  MapPinIcon,
  UserIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardBody, CardHeader, CardTitle, Button, Badge, Spinner } from '@/components/ui';
import { OrderStatusBadge, OrderStatus } from '@/components/orders/OrderStatusBadge';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { UpdateStatusDialog } from '@/components/orders/UpdateStatusDialog';
import { UpdatePaymentStatusDialog } from '@/components/orders/UpdatePaymentStatusDialog';
import { getOrder, updateOrderStatus, updatePaymentStatus } from '@/lib/api/orders.api';
import type { PaymentStatus } from '@/types';
import { formatCurrency, formatDateTime, resolveImageUrl } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';
import toast from 'react-hot-toast';

// Payment status badge helper
const getPaymentBadge = (status: string) => {
  const variants: Record<string, 'warning' | 'success' | 'error'> = {
    pending: 'warning',
    paid: 'success',
    failed: 'error',
    refunded: 'error',
  };
  return (
    <Badge variant={variants[status?.toLowerCase()] || 'warning'}>
      {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase()}
    </Badge>
  );
};

// Group items by brand
interface BrandGroup {
  brandId: string;
  brandName: string;
  minimumOrder: number;
  items: OrderItem[];
  subtotal: number;
}

function groupItemsByBrand(items: OrderItem[]): BrandGroup[] {
  const groups: Record<string, BrandGroup> = {};

  items.forEach((item) => {
    const brandId = item.product?.brandId || 'unknown';
    const brandName = item.product?.brand?.name || 'Unknown Brand';
    const minimumOrder = item.product?.brand?.minimumOrder || 0;

    if (!groups[brandId]) {
      groups[brandId] = {
        brandId,
        brandName,
        minimumOrder,
        items: [],
        subtotal: 0,
      };
    }

    groups[brandId].items.push(item);
    groups[brandId].subtotal += (item.price || 0) * (item.quantity || 0);
  });

  return Object.values(groups);
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;

  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [updatePaymentOpen, setUpdatePaymentOpen] = useState(false);

  // Fetch order data
  const { data: orderData, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: OrderStatus }) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      toast.success('Order status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setUpdateStatusOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order status');
    },
  });

  // Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: ({ paymentStatus, transactionId }: { paymentStatus: PaymentStatus; transactionId?: string }) =>
      updatePaymentStatus(orderId, { paymentStatus, transactionId }),
    onSuccess: () => {
      toast.success('Payment status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setUpdatePaymentOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payment status');
    },
  });

  const order: Order | undefined = orderData?.data;

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ status: newStatus });
  };

  const handleUpdatePaymentStatus = (newStatus: PaymentStatus, transactionId?: string) => {
    updatePaymentMutation.mutate({ paymentStatus: newStatus, transactionId });
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleSendEmail = () => {
    toast.success('Email sent to customer');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-error-500">Failed to load order</p>
        <Link href="/dashboard/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const brandGroups = groupItemsByBrand(order.items || []);

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-secondary-800">
                Order #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
              </h1>
              <OrderStatusBadge status={order.status as OrderStatus} size="lg" />
            </div>
            <p className="text-gray-600">
              Placed on {order.createdAt ? formatDateTime(order.createdAt) : '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSendEmail}>
            <EnvelopeIcon className="h-5 w-5 mr-2" />
            Email Customer
          </Button>
          <Button variant="outline" onClick={handlePrintInvoice}>
            <PrinterIcon className="h-5 w-5 mr-2" />
            Print Invoice
          </Button>
          <Button onClick={() => setUpdateStatusOpen(true)}>Update Status</Button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">
          Order #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
        </h1>
        <p className="text-gray-600">
          Placed on {order.createdAt ? formatDateTime(order.createdAt) : '—'}
        </p>
      </div>

      {/* Order Timeline */}
      <Card className="print:hidden">
        <CardBody>
          <OrderTimeline
            currentStatus={(order.status?.toLowerCase() || 'pending') as OrderStatus}
            statusHistory={order.statusHistory as { status: string; timestamp: string; notes?: string }[]}
            orientation="horizontal"
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {brandGroups.map((group) => {
                const meetsMinimum = group.subtotal >= group.minimumOrder;
                return (
                  <div key={group.brandId} className="border-b border-gray-200 last:border-b-0">
                    {/* Brand header */}
                    <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-secondary-800">{group.brandName}</span>
                        <span className="text-sm text-gray-500">
                          ({group.items.length} item{group.items.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                          Subtotal: <span className="font-medium">{formatCurrency(group.subtotal)}</span>
                        </span>
                        {group.minimumOrder > 0 && (
                          <div className="flex items-center gap-1">
                            {meetsMinimum ? (
                              <>
                                <CheckCircleIcon className="h-4 w-4 text-success-500" />
                                <span className="text-xs text-success-600">Min. met</span>
                              </>
                            ) : (
                              <>
                                <ExclamationCircleIcon className="h-4 w-4 text-warning-500" />
                                <span className="text-xs text-warning-600">
                                  Below min. ({formatCurrency(group.minimumOrder)})
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items table */}
                    <table className="w-full">
                      <tbody className="divide-y divide-gray-100">
                        {group.items.map((item, index) => (
                          <tr key={item.id || index}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                {item.product?.images && item.product.images.length > 0 ? (
                                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    <Image
                                      src={resolveImageUrl(item.product.images[0]) || ''}
                                      alt={item.product?.name || ''}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <CubeIcon className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-secondary-800">
                                    {item.product?.name || 'Unknown Product'}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    SKU: {item.product?.sku || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-sm text-gray-500">Unit Price</p>
                              <p className="font-medium">{formatCurrency(item.price || 0)}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <p className="text-sm text-gray-500">Qty</p>
                              <p className="font-medium">{item.quantity}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-sm text-gray-500">Subtotal</p>
                              <p className="font-medium">
                                {formatCurrency((item.price || 0) * (item.quantity || 0))}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardBody>
                {order.shippingAddress ? (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-secondary-800">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                    {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
                    <p>{order.shippingAddress.address1}</p>
                    {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.postalCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    {order.shippingAddress.phone && (
                      <p className="pt-2">Phone: {order.shippingAddress.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No shipping address provided</p>
                )}
              </CardBody>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardBody>
                {order.billingAddress ? (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-secondary-800">
                      {order.billingAddress.firstName} {order.billingAddress.lastName}
                    </p>
                    {order.billingAddress.company && <p>{order.billingAddress.company}</p>}
                    <p>{order.billingAddress.address1}</p>
                    {order.billingAddress.address2 && <p>{order.billingAddress.address2}</p>}
                    <p>
                      {order.billingAddress.city}, {order.billingAddress.state}{' '}
                      {order.billingAddress.postalCode}
                    </p>
                    <p>{order.billingAddress.country}</p>
                    {order.billingAddress.phone && (
                      <p className="pt-2">Phone: {order.billingAddress.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Same as shipping address</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-secondary-800">
                    {order.user?.firstName} {order.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{order.user?.email}</p>
                </div>
                {order.user?.businessName && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Business</p>
                    <p className="text-sm text-gray-600">{order.user.businessName}</p>
                  </div>
                )}
                {order.user?.phone && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Phone</p>
                    <p className="text-sm text-gray-600">{order.user.phone}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <Link
                    href={`/dashboard/users/${order.userId}`}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View Customer Profile →
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{formatCurrency(order.subtotal || 0)}</span>
                </div>
                {(order.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-medium text-success-600">
                      -{formatCurrency(order.discount ?? 0)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">
                    {(order.shippingCost ?? order.shipping ?? 0) > 0 ? formatCurrency(order.shippingCost ?? order.shipping ?? 0) : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium">{formatCurrency(order.tax || 0)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-medium text-secondary-800">Total</span>
                  <span className="text-xl font-bold text-secondary-800">
                    {formatCurrency(order.total || 0)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payment</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUpdatePaymentOpen(true)}
                className="print:hidden"
              >
                Update
              </Button>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  {getPaymentBadge(order.paymentStatus)}
                </div>
                {order.paymentMethod && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Method</span>
                    <span className="font-medium capitalize">{order.paymentMethod}</span>
                  </div>
                )}
                {order.transactionId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono text-xs">{order.transactionId}</span>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Order Notes</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Update Status Dialog */}
      <UpdateStatusDialog
        isOpen={updateStatusOpen}
        onClose={() => setUpdateStatusOpen(false)}
        onConfirm={handleUpdateStatus}
        currentStatus={order.status as OrderStatus}
        orderId={order.orderNumber || order.id.slice(0, 8).toUpperCase()}
        isUpdating={updateStatusMutation.isPending}
      />

      {/* Update Payment Status Dialog */}
      <UpdatePaymentStatusDialog
        isOpen={updatePaymentOpen}
        onClose={() => setUpdatePaymentOpen(false)}
        onConfirm={handleUpdatePaymentStatus}
        currentStatus={order.paymentStatus as PaymentStatus}
        orderId={order.orderNumber || order.id.slice(0, 8).toUpperCase()}
        isUpdating={updatePaymentMutation.isPending}
      />
    </div>
  );
}
