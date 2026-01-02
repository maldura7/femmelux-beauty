'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XCircleIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Application, formatApplicationId } from '@/lib/api/applications.api';

// ============================================
// TYPES
// ============================================

interface RejectApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onConfirm: (reason: string, sendEmail: boolean) => Promise<void>;
  isLoading?: boolean;
}

// ============================================
// REJECTION REASONS
// ============================================

const REJECTION_REASONS = [
  { value: 'incomplete_documents', label: 'Incomplete or missing documentation' },
  { value: 'invalid_business', label: 'Unable to verify business information' },
  { value: 'duplicate_application', label: 'Duplicate application detected' },
  { value: 'ineligible_business_type', label: 'Business type not eligible' },
  { value: 'insufficient_references', label: 'Insufficient business references' },
  { value: 'other', label: 'Other (specify below)' },
];

// ============================================
// REJECT APPLICATION MODAL COMPONENT
// ============================================

export default function RejectApplicationModal({
  isOpen,
  onClose,
  application,
  onConfirm,
  isLoading,
}: RejectApplicationModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  const handleConfirm = async () => {
    const reason = selectedReason === 'other'
      ? customReason
      : REJECTION_REASONS.find(r => r.value === selectedReason)?.label || customReason;

    if (!reason.trim()) return;

    await onConfirm(reason, sendEmail);
    setSelectedReason('');
    setCustomReason('');
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedReason('');
      setCustomReason('');
      onClose();
    }
  };

  if (!application) return null;

  const isValid = selectedReason !== '' && (selectedReason !== 'other' || customReason.trim() !== '');

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
                    <div className="p-2 bg-red-100 rounded-full">
                      <XCircleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                        Reject Application
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

                  {/* Warning */}
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      This action cannot be undone. The applicant will need to submit a new application if they wish to reapply.
                    </p>
                  </div>

                  {/* Rejection Reason Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {REJECTION_REASONS.map((reason) => (
                        <label
                          key={reason.value}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedReason === reason.value
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="rejection-reason"
                            value={reason.value}
                            checked={selectedReason === reason.value}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            disabled={isLoading}
                            className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="text-sm text-gray-700">{reason.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Custom Reason */}
                  {selectedReason === 'other' && (
                    <div>
                      <label
                        htmlFor="custom-reason"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Specify Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="custom-reason"
                        rows={3}
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                        placeholder="Enter the reason for rejection..."
                      />
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        disabled={isLoading}
                        className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700 flex items-center gap-2">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        Send rejection email to applicant
                      </span>
                    </label>
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
                    disabled={isLoading || !isValid}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
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
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4" />
                        Confirm Rejection
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
