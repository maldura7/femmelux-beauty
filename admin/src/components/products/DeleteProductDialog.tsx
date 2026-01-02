'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface DeleteProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  isDeleting?: boolean;
}

export function DeleteProductDialog({
  isOpen,
  onClose,
  onConfirm,
  productName,
  isDeleting = false,
}: DeleteProductDialogProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                  onClick={onClose}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>

                {/* Icon */}
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-100">
                  <ExclamationTriangleIcon className="h-6 w-6 text-error-600" />
                </div>

                {/* Title */}
                <Dialog.Title
                  as="h3"
                  className="mt-4 text-lg font-semibold text-center text-secondary-800"
                >
                  Delete Product
                </Dialog.Title>

                {/* Description */}
                <div className="mt-3">
                  <p className="text-sm text-gray-600 text-center">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-secondary-800">"{productName}"</span>?
                    This action cannot be undone.
                  </p>
                  <div className="mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <p className="text-xs text-warning-700">
                      <strong>Warning:</strong> This will permanently remove the product and all
                      associated data including images, inventory records, and order history
                      references.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="flex-1"
                    onClick={onConfirm}
                    isLoading={isDeleting}
                  >
                    Delete Product
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

export default DeleteProductDialog;
