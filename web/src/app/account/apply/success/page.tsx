'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, EnvelopeIcon, ClockIcon, PhoneIcon } from '@heroicons/react/24/outline';

// ============================================
// SUCCESS PAGE COMPONENT
// ============================================

export default function ApplicationSuccessPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-10 h-10 text-green-500" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-secondary-900 mb-3">
            Application Submitted Successfully!
          </h1>

          {/* Message */}
          <p className="text-gray-600 text-lg mb-8">
            Thank you for applying for a business account with FemmeLux Beauty. We've received your
            application and our team will review it shortly.
          </p>

          {/* What Happens Next Section */}
          <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">What Happens Next?</h2>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900">Application Review</h3>
                  <p className="text-sm text-gray-600">
                    Our team will review your application and verify the information provided.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900">Email Notification</h3>
                  <p className="text-sm text-gray-600">
                    You'll receive an email within 1-2 business days with our decision.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-secondary-900">Account Activation</h3>
                  <p className="text-sm text-gray-600">
                    Once approved, you'll have full access to wholesale pricing and can start
                    placing orders.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <ClockIcon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <h3 className="font-medium text-blue-900 text-sm">Review Time</h3>
              <p className="text-xs text-blue-700">1-2 Business Days</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <EnvelopeIcon className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium text-green-900 text-sm">Check Email</h3>
              <p className="text-xs text-green-700">For Updates</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <PhoneIcon className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <h3 className="font-medium text-purple-900 text-sm">Questions?</h3>
              <p className="text-xs text-purple-700">Contact Support</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/account/application"
              className="px-6 py-3 bg-secondary-800 text-white rounded-lg font-medium hover:bg-secondary-900 transition-colors"
            >
              View Application Status
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 text-secondary-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Have questions about your application?{' '}
            <Link href="/contact" className="text-primary-600 hover:text-primary-700 font-medium">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
