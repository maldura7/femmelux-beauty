'use client';

import { Fragment, useState, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { OrderStatusBadge, OrderStatus } from './OrderStatusBadge';

interface UpdateStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStatus: OrderStatus) => void;
  currentStatus: OrderStatus;
  orderId: string;
  isUpdating?: boolean;
}

const orderFlow: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [], // Terminal state
  cancelled: [], // Terminal state
};

export function UpdateStatusDialog({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  orderId,
  isUpdating = false,
}: UpdateStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);

  // Normalize status to lowercase for lookups (backend returns uppercase)
  const normalizedCurrentStatus = currentStatus?.toLowerCase() as OrderStatus;

  // Get allowed next statuses
  const allowedStatuses = useMemo(() => {
    return statusTransitions[normalizedCurrentStatus] || [];
  }, [normalizedCurrentStatus]);

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus);
    }
  };

  const handleClose = () => {
    setSelectedStatus(null);
    onClose();
  };

  const isTerminalState = normalizedCurrentStatus === 'delivered' || normalizedCurrentStatus === 'cancelled';

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Close button */}
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                  onClick={handleClose}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>

                {/* Title */}
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold text-secondary-800"
                >
                  Update Order Status
                </Dialog.Title>

                {/* Order ID */}
                <p className="mt-1 text-sm text-gray-500">
                  Order #{orderId}
                </p>

                {/* Current Status */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Current Status:</p>
                  <OrderStatusBadge status={normalizedCurrentStatus} size="lg" />
                </div>

                {isTerminalState ? (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <p className="text-sm">
                        This order is in a terminal state and cannot be updated further.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* New Status Selection */}
                    <div className="mt-6">
                      <p className="text-sm text-gray-600 mb-3">Select new status:</p>
                      <div className="space-y-2">
                        {allowedStatuses.map((status) => (
                          <label
                            key={status}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                              selectedStatus === status
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="status"
                              value={status}
                              checked={selectedStatus === status}
                              onChange={() => setSelectedStatus(status)}
                              className="sr-only"
                            />
                            <OrderStatusBadge status={status} />
                            {status === 'cancelled' && (
                              <span className="text-xs text-error-500 ml-auto">
                                This action cannot be undone
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Status Change Preview */}
                    {selectedStatus && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center gap-3">
                          <OrderStatusBadge status={normalizedCurrentStatus} size="sm" />
                          <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                          <OrderStatusBadge status={selectedStatus} size="sm" />
                        </div>
                      </div>
                    )}

                    {/* Warning for cancellation */}
                    {selectedStatus === 'cancelled' && (
                      <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-error-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-error-700">
                              Cancel this order?
                            </p>
                            <p className="text-xs text-error-600 mt-1">
                              This will cancel the order and notify the customer. This action
                              cannot be undone.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleClose}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  {!isTerminalState && (
                    <Button
                      type="button"
                      variant={selectedStatus === 'cancelled' ? 'danger' : 'primary'}
                      className="flex-1"
                      onClick={handleConfirm}
                      disabled={!selectedStatus || isUpdating}
                      isLoading={isUpdating}
                    >
                      {selectedStatus === 'cancelled' ? 'Cancel Order' : 'Update Status'}
                    </Button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default UpdateStatusDialog;
