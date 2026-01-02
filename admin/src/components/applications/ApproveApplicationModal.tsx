'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  CheckCircleIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { Application, formatApplicationId } from '@/lib/api/applications.api';

// ============================================
// TYPES
// ============================================

interface ApproveApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onConfirm: (notes: string, sendEmail: boolean) => Promise<void>;
  isLoading?: boolean;
}

// ============================================
// APPROVE APPLICATION MODAL COMPONENT
// ============================================

export default function ApproveApplicationModal({
  isOpen,
  onClose,
  application,
  onConfirm,
  isLoading,
}: ApproveApplicationModalProps) {
  const [notes, setNotes] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendOnboarding, setSendOnboarding] = useState(true);

  const handleConfirm = async () => {
    await onConfirm(notes, sendEmail);
    setNotes('');
  };

  const handleClose = () => {
    if (!isLoading) {
      setNotes('');
      onClose();
    }
  };

  if (!application) return null;

  const isVendor = application.applicationType === 'VENDOR';

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
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                        Approve Application
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        {formatApplicationId(application.id)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="mt-4 space-y-4">
                  {/* Applicant Info */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{application.businessName}</p>
                        <p className="text-sm text-gray-500">
                          {application.user?.firstName} {application.user?.lastName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Confirmation Message */}
                  <div className="text-sm text-gray-600">
                    <p>Are you sure you want to approve this application?</p>
                    {isVendor && (
                      <p className="mt-2 text-purple-600 font-medium">
                        A new brand will be created: "{application.brandName}"
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Internal Notes (optional)
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      placeholder="Add any notes for internal record..."
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        disabled={isLoading}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700 flex items-center gap-2">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        Send approval email to applicant
                      </span>
                    </label>

                    {isVendor && (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sendOnboarding}
                          onChange={(e) => setSendOnboarding(e.target.checked)}
                          disabled={isLoading}
                          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-700 flex items-center gap-2">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          Send vendor onboarding email
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Confirm Approval
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
