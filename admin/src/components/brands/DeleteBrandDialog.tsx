'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface DeleteBrandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  brandName: string;
  isDeleting?: boolean;
}

export function DeleteBrandDialog({
  isOpen,
  onClose,
  onConfirm,
  brandName,
  isDeleting = false,
}: DeleteBrandDialogProps) {
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
          <div className="fixed inset-0 bg-black/50" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
                  className="mt-4 text-center text-lg font-semibold text-gray-900"
                >
                  Delete Brand
                </Dialog.Title>

                {/* Description */}
                <div className="mt-2">
                  <p className="text-center text-sm text-gray-500">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-gray-900">{brandName}</span>?
                    This action cannot be undone.
                  </p>
                </div>

                {/* Warning */}
                <div className="mt-4 rounded-lg bg-warning-50 p-3">
                  <p className="text-sm text-warning-800">
                    <strong>Warning:</strong> Deleting this brand will also remove all
                    associated products and order history. Consider deactivating the
                    brand instead if you want to preserve the data.
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={onConfirm}
                    isLoading={isDeleting}
                  >
                    Delete Brand
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

export default DeleteBrandDialog;
