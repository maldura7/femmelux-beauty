'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { ApplicationForm } from '@/components/application';
import { isApproved, isPending, isRejected } from '@/lib/auth';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// ============================================
// APPLY PAGE COMPONENT
// ============================================

export default function ApplyPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading while checking auth
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-primary-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Login Required</h1>
            <p className="text-gray-600 mb-6">
              Please login or create an account to apply for a business account.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login?redirect=/account/apply"
                className="px-6 py-3 bg-secondary-800 text-white rounded-lg font-medium hover:bg-secondary-900 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register?redirect=/account/apply"
                className="px-6 py-3 bg-primary-500 text-secondary-900 rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is approved, redirect to homepage
  if (isApproved(user)) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Already Approved!</h1>
            <p className="text-gray-600 mb-6">
              Your business account has already been approved. You have full access to wholesale
              pricing and can start shopping.
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-primary-500 text-secondary-900 rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If user has pending application
  if (isPending(user)) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Application Under Review</h1>
            <p className="text-gray-600 mb-6">
              You've already submitted a business application. Our team is reviewing it and you'll
              receive an email within 1-2 business days.
            </p>
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
        </div>
      </div>
    );
  }

  // If user's application was rejected, show reapply form
  const showReapplyMessage = isRejected(user);

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900">
            {showReapplyMessage ? 'Reapply for Business Account' : 'Apply for Business Account'}
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            {showReapplyMessage
              ? 'Your previous application was not approved. Please review the feedback and submit a new application.'
              : 'Complete the form below to apply for a wholesale business account. Once approved, you\'ll have access to exclusive pricing and features.'}
          </p>
        </div>

        {/* Rejection Notice */}
        {showReapplyMessage && user?.rejectionReason && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800">Previous Application Feedback</h3>
                  <p className="mt-1 text-sm text-red-700">{user.rejectionReason}</p>
                  <p className="mt-2 text-sm text-red-600">
                    Please address the issues mentioned above in your new application.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application Form */}
        <ApplicationForm isResubmit={showReapplyMessage} />
      </div>
    </div>
  );
}
