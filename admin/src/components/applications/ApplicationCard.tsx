'use client';

import Link from 'next/link';
import {
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  Application,
  formatApplicationId,
  formatDate,
  getStatusColor,
  getTypeColor,
  getLabel,
  BUSINESS_TYPES,
} from '@/lib/api/applications.api';

// ============================================
// TYPES
// ============================================

interface ApplicationCardProps {
  application: Application;
  onApprove?: (application: Application) => void;
  onReject?: (application: Application) => void;
}

// ============================================
// APPLICATION CARD COMPONENT
// ============================================

export default function ApplicationCard({
  application,
  onApprove,
  onReject,
}: ApplicationCardProps) {
  const statusColor = getStatusColor(application.status);
  const typeColor = getTypeColor(application.applicationType);
  const isPending = application.status === 'PENDING';

  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${
        isPending ? 'border-yellow-300 ring-1 ring-yellow-100' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor.bg} ${statusColor.text}`}
              >
                {application.status}
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${typeColor.bg} ${typeColor.text}`}
              >
                {application.applicationType}
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">
              {application.businessName}
            </h3>
            <p className="text-sm text-gray-500">
              {formatApplicationId(application.id)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Applicant */}
        {application.user && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {application.user.firstName[0]}
                {application.user.lastName[0]}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {application.user.firstName} {application.user.lastName}
              </p>
              <p className="text-gray-500">{application.user.email}</p>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
            <span>{getLabel(application.businessType, BUSINESS_TYPES)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <PhoneIcon className="h-4 w-4 text-gray-400" />
            <span>{application.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 col-span-2">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span>Submitted {formatDate(application.submittedAt)}</span>
          </div>
        </div>

        {/* Vendor Brand Name */}
        {application.applicationType === 'VENDOR' && application.brandName && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm">
              <span className="text-gray-500">Brand:</span>{' '}
              <span className="font-medium text-purple-600">{application.brandName}</span>
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <Link
          href={`/applications/${application.id}`}
          className="flex items-center gap-1 text-sm text-gold hover:text-gold/80 font-medium"
        >
          <EyeIcon className="h-4 w-4" />
          View Details
        </Link>

        {isPending && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onApprove?.(application)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
            >
              <CheckIcon className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => onReject?.(application)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
