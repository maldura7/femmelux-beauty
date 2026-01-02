'use client';

import Link from 'next/link';
import { User, isPending, isRejected, isGuest, isSuspended } from '@/lib/auth';

// ============================================
// TYPES
// ============================================

interface AccountStatusBannerProps {
  user: User | null | undefined;
}

// ============================================
// ACCOUNT STATUS BANNER COMPONENT
// ============================================

export default function AccountStatusBanner({ user }: AccountStatusBannerProps) {
  // Don't show banner if no user or user is approved
  if (!user) return null;

  // Guest - hasn't applied yet
  if (isGuest(user)) {
    return (
      <div className="bg-blue-100 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <p className="text-blue-800 text-sm">
              <span className="font-medium">Welcome!</span> Complete your business application to access wholesale pricing.
            </p>
            <Link
              href="/account/apply"
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pending application
  if (isPending(user)) {
    return (
      <div className="bg-yellow-100 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-yellow-800 text-sm">
              Your business application is <span className="font-medium">under review</span>.
              We'll notify you within 1-2 business days.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Rejected application
  if (isRejected(user)) {
    return (
      <div className="bg-red-100 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-red-800 text-sm">
                Your application was <span className="font-medium">not approved</span>.
                {user.rejectionReason && (
                  <span className="ml-1">({user.rejectionReason})</span>
                )}
              </p>
            </div>
            <Link
              href="/account/apply"
              className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
            >
              Reapply
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Suspended account
  if (isSuspended(user)) {
    return (
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <p className="text-white text-sm">
              Your account has been <span className="font-medium text-red-400">suspended</span>.
              {user.suspensionReason && (
                <span className="ml-1 text-gray-300">({user.suspensionReason})</span>
              )}
              <Link href="/contact" className="ml-2 underline hover:text-gray-200">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Approved users don't see a banner
  return null;
}
