'use client';

import Link from 'next/link';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  Application,
  formatApplicationId,
  formatDate,
  getTypeColor,
} from '@/lib/api/applications.api';

interface PendingApplicationsWidgetProps {
  applications: Application[];
  isLoading?: boolean;
  maxItems?: number;
  onApprove?: (application: Application) => void;
  onReject?: (application: Application) => void;
}

export function PendingApplicationsWidget({
  applications,
  isLoading = false,
  maxItems = 5,
  onApprove,
  onReject,
}: PendingApplicationsWidgetProps) {
  const displayApplications = applications.slice(0, maxItems);
  const pendingCount = applications.length;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Pending Applications</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[...Array(maxItems)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                  <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
                  <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Applications</CardTitle>
          <Link
            href="/dashboard/applications"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all →
          </Link>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
            <DocumentTextIcon className="h-10 w-10 text-gray-300 mb-2" />
            <p>No pending applications</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Pending Applications</CardTitle>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
              {pendingCount}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/applications"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View all →
        </Link>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {displayApplications.map((application) => {
            const typeColor = getTypeColor(application.applicationType);

            return (
              <div
                key={application.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <ClockIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {application.businessName}
                      </p>
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${typeColor.bg} ${typeColor.text}`}
                      >
                        {application.applicationType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {application.user?.firstName} {application.user?.lastName} • {formatDate(application.submittedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/applications/${application.id}`}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="View details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                  {onApprove && (
                    <button
                      onClick={() => onApprove(application)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Approve"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                  )}
                  {onReject && (
                    <button
                      onClick={() => onReject(application)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Reject"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {applications.length > maxItems && (
          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <Link
              href="/dashboard/applications?status=PENDING"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View {applications.length - maxItems} more pending applications →
            </Link>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export default PendingApplicationsWidget;
