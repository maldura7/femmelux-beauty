'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  getAllApplications,
  approveApplication,
  rejectApplication,
  exportApplications,
  getApplicationStats,
  Application,
  ApplicationFilters as ApplicationFiltersType,
  formatApplicationId,
  formatDate,
  getStatusColor,
  getTypeColor,
} from '@/lib/api/applications.api';
import {
  ApplicationFilters,
  ApplicationStats,
  ApproveApplicationModal,
  RejectApplicationModal,
} from '@/components/applications';
import { toast } from 'react-hot-toast';

// ============================================
// APPLICATIONS LIST PAGE
// ============================================

export default function ApplicationsPage() {
  const queryClient = useQueryClient();

  // Filters state
  const [filters, setFilters] = useState<ApplicationFiltersType>({
    page: 1,
    limit: 10,
    sortBy: 'submittedAt',
    sortOrder: 'desc',
  });

  // Modal states
  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    application: Application | null;
  }>({ isOpen: false, application: null });

  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    application: Application | null;
  }>({ isOpen: false, application: null });

  // Fetch applications
  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['applications', filters],
    queryFn: () => getAllApplications(filters),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['application-stats'],
    queryFn: getApplicationStats,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      approveApplication(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application-stats'] });
      toast.success('Application approved successfully');
      setApproveModal({ isOpen: false, application: null });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve application');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectApplication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application-stats'] });
      toast.success('Application rejected');
      setRejectModal({ isOpen: false, application: null });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject application');
    },
  });

  // Export handler
  const handleExport = async () => {
    try {
      const blob = await exportApplications(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Applications exported successfully');
    } catch (error) {
      toast.error('Failed to export applications');
    }
  };

  // Pagination
  const totalPages = applicationsData?.totalPages || 1;
  const currentPage = applicationsData?.page || 1;

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">
            Review and manage business account applications
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      {stats && <ApplicationStats stats={stats} />}

      {/* Filters */}
      <ApplicationFilters
        filters={filters}
        onFiltersChange={setFilters}
        pendingCount={stats?.pending || 0}
      />

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-gold border-r-transparent" />
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        ) : !applicationsData?.data?.length ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No applications found</h3>
            <p className="mt-2 text-gray-600">
              {filters.status || filters.search
                ? 'Try adjusting your filters'
                : 'Applications will appear here when submitted'}
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applicationsData.data.map((application) => {
                    const statusColor = getStatusColor(application.status);
                    const typeColor = getTypeColor(application.applicationType);
                    const isPending = application.status === 'PENDING';

                    return (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {application.businessName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatApplicationId(application.id)}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {application.user ? (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {application.user.firstName[0]}
                                  {application.user.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-900">
                                  {application.user.firstName} {application.user.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{application.user.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeColor.bg} ${typeColor.text}`}
                          >
                            {application.applicationType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor.bg} ${statusColor.text}`}
                          >
                            {application.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(application.submittedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/applications/${application.id}`}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                            {isPending && (
                              <>
                                <button
                                  onClick={() =>
                                    setApproveModal({ isOpen: true, application })
                                  }
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Approve"
                                >
                                  <CheckIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setRejectModal({ isOpen: true, application })
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Reject"
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing{' '}
                <span className="font-medium">
                  {((currentPage - 1) * (filters.limit || 10)) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(
                    currentPage * (filters.limit || 10),
                    applicationsData.total
                  )}
                </span>{' '}
                of{' '}
                <span className="font-medium">{applicationsData.total}</span> results
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-gold text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Approve Modal */}
      <ApproveApplicationModal
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ isOpen: false, application: null })}
        application={approveModal.application}
        onConfirm={async (notes, sendEmail) => {
          if (approveModal.application) {
            await approveMutation.mutateAsync({
              id: approveModal.application.id,
              notes,
            });
          }
        }}
        isLoading={approveMutation.isPending}
      />

      {/* Reject Modal */}
      <RejectApplicationModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, application: null })}
        application={rejectModal.application}
        onConfirm={async (reason, sendEmail) => {
          if (rejectModal.application) {
            await rejectMutation.mutateAsync({
              id: rejectModal.application.id,
              reason,
            });
          }
        }}
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
}
