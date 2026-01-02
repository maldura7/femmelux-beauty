'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  BanknotesIcon,
  TagIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import {
  getApplication,
  approveApplication,
  rejectApplication,
  formatApplicationId,
  formatDate,
  formatDateTime,
  getStatusColor,
  getTypeColor,
  getLabel,
  BUSINESS_TYPES,
  US_STATES,
  MONTHLY_PURCHASE_LABELS,
  PRODUCT_CATEGORIES,
  HEAR_ABOUT_US_LABELS,
} from '@/lib/api/applications.api';
import { ApproveApplicationModal, RejectApplicationModal } from '@/components/applications';
import { toast } from 'react-hot-toast';

// ============================================
// APPLICATION DETAIL PAGE
// ============================================

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  // Fetch application
  const { data: application, isLoading, error } = useQuery({
    queryKey: ['application', id],
    queryFn: () => getApplication(id),
    enabled: !!id,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ notes }: { notes?: string }) => approveApplication(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application-stats'] });
      toast.success('Application approved successfully');
      setApproveModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve application');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ reason }: { reason: string }) => rejectApplication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application-stats'] });
      toast.success('Application rejected');
      setRejectModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject application');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent" />
          <p className="mt-2 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Application not found</h3>
        <p className="mt-2 text-gray-600">
          The application you're looking for doesn't exist or has been deleted.
        </p>
        <Link
          href="/dashboard/applications"
          className="mt-4 inline-flex items-center gap-2 text-gold hover:text-gold/80"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to applications
        </Link>
      </div>
    );
  }

  const statusColor = getStatusColor(application.status);
  const typeColor = getTypeColor(application.applicationType);
  const isPending = application.status === 'PENDING';
  const isVendor = application.applicationType === 'VENDOR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/applications"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {application.businessName}
              </h1>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor.bg} ${statusColor.text}`}
              >
                {application.status}
              </span>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${typeColor.bg} ${typeColor.text}`}
              >
                {application.applicationType}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{formatApplicationId(application.id)}</p>
          </div>
        </div>

        {isPending && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRejectModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              <XCircleIcon className="h-5 w-5" />
              Reject
            </button>
            <button
              onClick={() => setApproveModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Approve
            </button>
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Timeline</h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-6">
            {/* Submitted */}
            <div className="relative flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center z-10">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Application Submitted</p>
                <p className="text-sm text-gray-500">{formatDateTime(application.submittedAt)}</p>
              </div>
            </div>

            {/* Reviewed */}
            {application.reviewedAt && (
              <div className="relative flex gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    application.status === 'APPROVED'
                      ? 'bg-green-100'
                      : application.status === 'REJECTED'
                      ? 'bg-red-100'
                      : 'bg-gray-100'
                  }`}
                >
                  {application.status === 'APPROVED' ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  ) : application.status === 'REJECTED' ? (
                    <XCircleIcon className="h-4 w-4 text-red-600" />
                  ) : (
                    <ClockIcon className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Application {application.status.toLowerCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(application.reviewedAt)}
                    {application.reviewer && (
                      <> by {application.reviewer.firstName} {application.reviewer.lastName}</>
                    )}
                  </p>
                  {application.reviewNotes && (
                    <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {application.reviewNotes}
                    </p>
                  )}
                  {application.rejectionReason && (
                    <p className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded">
                      <strong>Reason:</strong> {application.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Pending indicator */}
            {isPending && (
              <div className="relative flex gap-4">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center z-10 animate-pulse">
                  <ClockIcon className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Awaiting Review</p>
                  <p className="text-sm text-gray-500">Application is pending approval</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              Business Information
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Business Name</dt>
                <dd className="text-sm font-medium text-gray-900">{application.businessName}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Business Type</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {getLabel(application.businessType, BUSINESS_TYPES)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Tax ID / EIN</dt>
                <dd className="text-sm font-medium text-gray-900">{application.taxId}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Years in Business</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {application.businessYears} years
                </dd>
              </div>
              {application.businessLicense && (
                <div>
                  <dt className="text-sm text-gray-500">Business License</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {application.businessLicense}
                  </dd>
                </div>
              )}
              {application.resaleCertificate && (
                <div>
                  <dt className="text-sm text-gray-500">Resale Certificate</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {application.resaleCertificate}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              Contact Information
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Phone</dt>
                <dd className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <PhoneIcon className="h-4 w-4 text-gray-400" />
                  {application.phone}
                </dd>
              </div>
              {application.businessWebsite && (
                <div>
                  <dt className="text-sm text-gray-500">Website</dt>
                  <dd className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                    <a
                      href={application.businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline flex items-center gap-1"
                    >
                      {application.businessWebsite}
                      <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-sm text-gray-500">Business Address</dt>
                <dd className="text-sm font-medium text-gray-900 flex items-start gap-2">
                  <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>
                    {application.businessAddress.street}<br />
                    {application.businessAddress.city}, {getLabel(application.businessAddress.state, US_STATES)} {application.businessAddress.zip}<br />
                    {application.businessAddress.country}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Purchase Information (Customer) */}
          {application.applicationType === 'CUSTOMER' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BanknotesIcon className="h-5 w-5 text-gray-400" />
                Purchase Information
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {application.estimatedMonthlyPurchase && (
                  <div>
                    <dt className="text-sm text-gray-500">Estimated Monthly Purchase</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {getLabel(application.estimatedMonthlyPurchase, MONTHLY_PURCHASE_LABELS)}
                    </dd>
                  </div>
                )}
                {application.productCategories && application.productCategories.length > 0 && (
                  <div className="col-span-2">
                    <dt className="text-sm text-gray-500">Product Categories of Interest</dt>
                    <dd className="flex flex-wrap gap-2 mt-1">
                      {application.productCategories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {getLabel(cat, PRODUCT_CATEGORIES)}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Vendor Information */}
          {isVendor && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TagIcon className="h-5 w-5 text-gray-400" />
                Vendor / Brand Information
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {application.brandName && (
                  <div>
                    <dt className="text-sm text-gray-500">Brand Name</dt>
                    <dd className="text-sm font-medium text-purple-600">{application.brandName}</dd>
                  </div>
                )}
                {application.minimumOrderAmount && (
                  <div>
                    <dt className="text-sm text-gray-500">Minimum Order Amount</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      ${application.minimumOrderAmount.toLocaleString()}
                    </dd>
                  </div>
                )}
                {application.productLineSize && (
                  <div>
                    <dt className="text-sm text-gray-500">Product Line Size</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {application.productLineSize} products
                    </dd>
                  </div>
                )}
                {application.brandDescription && (
                  <div className="col-span-2">
                    <dt className="text-sm text-gray-500">Brand Description</dt>
                    <dd className="text-sm text-gray-900 mt-1">{application.brandDescription}</dd>
                  </div>
                )}
                {application.vendorProductCategories &&
                  application.vendorProductCategories.length > 0 && (
                    <div className="col-span-2">
                      <dt className="text-sm text-gray-500">Product Categories</dt>
                      <dd className="flex flex-wrap gap-2 mt-1">
                        {application.vendorProductCategories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                          >
                            {getLabel(cat, PRODUCT_CATEGORIES)}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
              </dl>
            </div>
          )}

          {/* References & Documents */}
          {(application.businessReferences || (application.documents && application.documents.length > 0)) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DocumentDuplicateIcon className="h-5 w-5 text-gray-400" />
                References & Documents
              </h2>
              <dl className="space-y-4">
                {application.businessReferences && (
                  <div>
                    <dt className="text-sm text-gray-500">Business References</dt>
                    <dd className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                      {application.businessReferences}
                    </dd>
                  </div>
                )}
                {application.documents && application.documents.length > 0 && (
                  <div>
                    <dt className="text-sm text-gray-500">Uploaded Documents</dt>
                    <dd className="mt-2 space-y-2">
                      {application.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-700 truncate">
                            Document {idx + 1}
                          </span>
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400" />
                        </a>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Additional Notes */}
          {(application.hearAboutUs || application.additionalNotes) && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              <dl className="space-y-4">
                {application.hearAboutUs && (
                  <div>
                    <dt className="text-sm text-gray-500">How they heard about us</dt>
                    <dd className="text-sm text-gray-900">
                      {getLabel(application.hearAboutUs, HEAR_ABOUT_US_LABELS)}
                    </dd>
                  </div>
                )}
                {application.additionalNotes && (
                  <div>
                    <dt className="text-sm text-gray-500">Additional Notes</dt>
                    <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                      {application.additionalNotes}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Applicant Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              Applicant
            </h2>
            {application.user ? (
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {application.user.firstName[0]}
                      {application.user.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {application.user.firstName} {application.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{application.user.email}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Account created: {formatDate(application.user.createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">User information not available</p>
            )}
          </div>

          {/* Quick Actions */}
          {isPending && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Pending Review</h3>
              <p className="text-sm text-yellow-700 mb-4">
                This application is awaiting your review. Please verify all information before making a decision.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setApproveModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Approve Application
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
                >
                  <XCircleIcon className="h-5 w-5" />
                  Reject Application
                </button>
              </div>
            </div>
          )}

          {/* Approval Info */}
          {application.status === 'APPROVED' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Approved</h3>
              </div>
              <p className="text-sm text-green-700">
                Approved on {formatDate(application.reviewedAt)}
                {application.reviewer && (
                  <> by {application.reviewer.firstName} {application.reviewer.lastName}</>
                )}
              </p>
              {isVendor && application.brandName && (
                <p className="text-sm text-green-700 mt-2">
                  Brand "{application.brandName}" has been created.
                </p>
              )}
            </div>
          )}

          {/* Rejection Info */}
          {application.status === 'REJECTED' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <XCircleIcon className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Rejected</h3>
              </div>
              <p className="text-sm text-red-700">
                Rejected on {formatDate(application.reviewedAt)}
                {application.reviewer && (
                  <> by {application.reviewer.firstName} {application.reviewer.lastName}</>
                )}
              </p>
              {application.rejectionReason && (
                <p className="text-sm text-red-700 mt-2">
                  <strong>Reason:</strong> {application.rejectionReason}
                </p>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
            <p>Application ID: {application.id}</p>
            <p className="mt-1">Created: {formatDateTime(application.createdAt)}</p>
            <p className="mt-1">Updated: {formatDateTime(application.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ApproveApplicationModal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        application={application}
        onConfirm={async (notes) => {
          await approveMutation.mutateAsync({ notes });
        }}
        isLoading={approveMutation.isPending}
      />

      <RejectApplicationModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        application={application}
        onConfirm={async (reason) => {
          await rejectMutation.mutateAsync({ reason });
        }}
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
}
