'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { isApproved, isPending, isRejected, isGuest } from '@/lib/auth';
import {
  getLatestApplication,
  Application,
  BUSINESS_TYPES,
  US_STATES,
  MONTHLY_PURCHASE_OPTIONS,
  PRODUCT_CATEGORIES,
} from '@/lib/api/applications.api';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

// ============================================
// HELPER FUNCTIONS
// ============================================

function getLabel(value: string | undefined, options: { value: string; label: string }[]): string {
  if (!value) return '-';
  const option = options.find((o) => o.value === value);
  return option?.label || value;
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================
// APPLICATION STATUS PAGE COMPONENT
// ============================================

export default function ApplicationStatusPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [application, setApplication] = useState<Application | null>(null);
  const [loadingApplication, setLoadingApplication] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const app = await getLatestApplication();
        setApplication(app);
      } catch (error) {
        console.error('Failed to fetch application:', error);
      } finally {
        setLoadingApplication(false);
      }
    };

    if (isAuthenticated) {
      fetchApplication();
    } else {
      setLoadingApplication(false);
    }
  }, [isAuthenticated]);

  // Show loading
  if (!mounted || isLoading || loadingApplication) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Login Required</h1>
            <p className="text-gray-600 mb-6">Please login to view your application status.</p>
            <Link
              href="/login?redirect=/account/application"
              className="inline-block px-6 py-3 bg-secondary-800 text-white rounded-lg font-medium hover:bg-secondary-900 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User is approved
  if (isApproved(user)) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-3">Account Approved!</h1>
            <p className="text-gray-600 text-lg mb-6">
              Congratulations! Your business account has been approved. You now have full access to
              wholesale pricing and can start placing orders.
            </p>

            {application?.reviewedAt && (
              <p className="text-sm text-gray-500 mb-6">
                Approved on {formatDate(application.reviewedAt)}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-secondary-900 rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Start Shopping
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                href="/account"
                className="px-6 py-3 border border-gray-300 text-secondary-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                View Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has pending application
  if (isPending(user) && application) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mb-8">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClockIcon className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-3">Application Under Review</h1>
            <p className="text-gray-600 text-lg mb-4">
              Your business application is being reviewed by our team. We'll notify you via email
              within 1-2 business days.
            </p>
            <p className="text-sm text-gray-500">
              Submitted on {formatDate(application.submittedAt)}
            </p>
          </div>

          {/* Application Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" />
                Application Details
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Business Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  Business Information
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-gray-400">Business Name</dt>
                    <dd className="text-sm font-medium text-secondary-900">
                      {application.businessName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Business Type</dt>
                    <dd className="text-sm font-medium text-secondary-900">
                      {getLabel(application.businessType, BUSINESS_TYPES)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Years in Business</dt>
                    <dd className="text-sm font-medium text-secondary-900">
                      {application.businessYears} years
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Application Type</dt>
                    <dd className="text-sm font-medium text-secondary-900">
                      {application.applicationType === 'CUSTOMER'
                        ? 'Business Customer'
                        : 'Vendor'}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Contact Info */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4" />
                  Contact Information
                </h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-gray-400">Phone</dt>
                    <dd className="text-sm font-medium text-secondary-900">{application.phone}</dd>
                  </div>
                  {application.businessWebsite && (
                    <div>
                      <dt className="text-xs text-gray-400">Website</dt>
                      <dd className="text-sm font-medium text-secondary-900">
                        {application.businessWebsite}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Address */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4" />
                  Business Address
                </h3>
                <p className="text-sm text-secondary-900">
                  {application.businessAddress?.street}
                  <br />
                  {application.businessAddress?.city},{' '}
                  {getLabel(application.businessAddress?.state, US_STATES)}{' '}
                  {application.businessAddress?.zip}
                  <br />
                  {application.businessAddress?.country}
                </p>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Have questions?{' '}
              <Link
                href="/contact"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User's application was rejected
  if (isRejected(user)) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircleIcon className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-3">Application Not Approved</h1>
            <p className="text-gray-600 text-lg mb-4">
              Unfortunately, your business application was not approved at this time.
            </p>

            {user?.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium text-red-800 mb-1">Reason:</h3>
                <p className="text-sm text-red-700">{user.rejectionReason}</p>
              </div>
            )}

            <p className="text-gray-600 mb-6">
              You can submit a new application addressing the concerns above.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/account/apply"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 text-secondary-900 rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Submit New Application
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 border border-gray-300 text-secondary-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is guest (hasn't applied yet)
  if (isGuest(user) || !application) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <DocumentTextIcon className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-secondary-900 mb-3">No Application Found</h1>
            <p className="text-gray-600 text-lg mb-6">
              You haven't submitted a business application yet. Apply now to access wholesale
              pricing and exclusive features.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-secondary-900 mb-3">Benefits of a Business Account:</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  Access to wholesale pricing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  Priority customer support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  Exclusive deals and promotions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  Fast order processing
                </li>
              </ul>
            </div>

            <Link
              href="/account/apply"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary-500 text-secondary-900 rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Start Application
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4 text-center">
        <p className="text-gray-600">Unable to determine application status.</p>
        <Link
          href="/account/apply"
          className="mt-4 inline-block px-6 py-3 bg-primary-500 text-secondary-900 rounded-lg font-medium hover:bg-primary-600 transition-colors"
        >
          Apply Now
        </Link>
      </div>
    </div>
  );
}
