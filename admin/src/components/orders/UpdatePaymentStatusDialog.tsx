'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CurrencyDollarIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import type { PaymentStatus } from '@/types';

interface UpdatePaymentStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newStatus: PaymentStatus, transactionId?: string) => void;
  currentStatus: PaymentStatus;
  orderId: string;
  isUpdating?: boolean;
}

const paymentStatusOptions: { value: PaymentStatus; label: string; description: string; icon: typeof CheckCircleIcon; color: string }[] = [
  {
    value: 'PENDING',
    label: 'Pending',
    description: 'Payment has not been received yet',
    icon: ClockIcon,
    color: 'text-yellow-500',
  },
  {
    value: 'PAID',
    label: 'Paid',
    description: 'Payment has been received and confirmed',
    icon: CheckCircleIcon,
    color: 'text-green-500',
  },
  {
    value: 'FAILED',
    label: 'Failed',
    description: 'Payment attempt failed',
    icon: XCircleIcon,
    color: 'text-red-500',
  },
];

function PaymentStatusBadge({ status, size = 'md' }: { status: PaymentStatus; size?: 'sm' | 'md' | 'lg' }) {
  const normalizedStatus = status?.toUpperCase() as PaymentStatus;

  const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
    PAID: { label: 'Paid', className: 'bg-green-100 text-green-800' },
    FAILED: { label: 'Failed', className: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[normalizedStatus] || statusConfig.PENDING;
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  );
}

export function UpdatePaymentStatusDialog({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  orderId,
  isUpdating = false,
}: UpdatePaymentStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | null>(null);
  const [transactionId, setTransactionId] = useState('');

  const normalizedCurrentStatus = currentStatus?.toUpperCase() as PaymentStatus;

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus, transactionId || undefined);
    }
  };

  const handleClose = () => {
    setSelectedStatus(null);
    setTransactionId('');
    onClose();
  };

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
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-6 w-6 text-primary-500" />
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold text-secondary-800"
                  >
                    Update Payment Status
                  </Dialog.Title>
                </div>

                {/* Order ID */}
                <p className="mt-1 text-sm text-gray-500">
                  Order #{orderId}
                </p>

                {/* Current Status */}
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Current Payment Status:</p>
                  <PaymentStatusBadge status={normalizedCurrentStatus} size="lg" />
                </div>

                {/* New Status Selection */}
                <div className="mt-6">
                  <p className="text-sm text-gray-600 mb-3">Select new payment status:</p>
                  <div className="space-y-2">
                    {paymentStatusOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedStatus === option.value;
                      const isCurrent = normalizedCurrentStatus === option.value;

                      return (
                        <label
                          key={option.value}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : isCurrent
                              ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentStatus"
                            value={option.value}
                            checked={isSelected}
                            onChange={() => !isCurrent && setSelectedStatus(option.value)}
                            disabled={isCurrent}
                            className="sr-only"
                          />
                          <Icon className={`h-5 w-5 ${option.color}`} />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{option.label}</p>
                            <p className="text-xs text-gray-500">{option.description}</p>
                          </div>
                          {isCurrent && (
                            <span className="text-xs text-gray-400">Current</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Transaction ID (optional, shown when marking as Paid) */}
                {selectedStatus === 'PAID' && (
                  <div className="mt-4">
                    <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-1">
                      Transaction ID (optional)
                    </label>
                    <input
                      type="text"
                      id="transactionId"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter transaction reference"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
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
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1"
                    onClick={handleConfirm}
                    disabled={!selectedStatus || isUpdating}
                    isLoading={isUpdating}
                  >
                    Update Payment
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default UpdatePaymentStatusDialog;
