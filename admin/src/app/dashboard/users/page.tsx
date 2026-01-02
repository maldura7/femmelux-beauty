'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Card, CardBody, Button, Badge, Avatar } from '@/components/ui';
import {
  getAllUsers,
  getUserStats,
  User,
  UserRole,
  AccountStatus,
  getRoleColor,
  getAccountStatusColor,
  formatDateTime,
  getFullName,
} from '@/lib/api/users.api';

// ============================================
// FILTER OPTIONS
// ============================================

const ROLE_OPTIONS: { value: UserRole | ''; label: string }[] = [
  { value: '', label: 'All Roles' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'ADMIN', label: 'Admin' },
];

const STATUS_OPTIONS: { value: AccountStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'GUEST', label: 'Guest' },
];

// ============================================
// USERS PAGE COMPONENT
// ============================================

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | ''>('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['users', { search: searchQuery, role: roleFilter, accountStatus: statusFilter, page }],
    queryFn: () => getAllUsers({
      search: searchQuery || undefined,
      role: roleFilter || undefined,
      accountStatus: statusFilter || undefined,
      page,
      limit: 20,
    }),
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['userStats'],
    queryFn: getUserStats,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-800">Users</h1>
          <p className="text-gray-600">Manage customers, vendors, and administrators</p>
        </div>
        <Button>
          <PlusIcon className="h-5 w-5 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <p className="text-sm text-gray-500">Customers</p>
              <p className="text-2xl font-bold text-green-600">{stats.customers}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <p className="text-sm text-gray-500">Vendors</p>
              <p className="text-2xl font-bold text-blue-600">{stats.vendors}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-purple-600">{stats.approved}</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Search and filters */}
      <Card>
        <CardBody>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or business..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-4 pt-4 border-t">
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value as UserRole | '');
                    setPage(1);
                  }}
                  className="input max-w-xs"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as AccountStatus | '');
                    setPage(1);
                  }}
                  className="input max-w-xs"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <Button type="button" variant="ghost" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </form>
        </CardBody>
      </Card>

      {/* Users table */}
      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              Failed to load users. Please try again.
            </div>
          ) : !usersData?.data?.length ? (
            <div className="p-8 text-center text-gray-500">
              No users found.
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Business</th>
                    <th>Role</th>
                    <th>Account Status</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usersData.data.map((user: User) => {
                    const roleColors = getRoleColor(user.role);
                    const statusColors = getAccountStatusColor(user.accountStatus);

                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={getFullName(user)} size="sm" />
                            <span className="font-medium">{getFullName(user)}</span>
                          </div>
                        </td>
                        <td className="text-gray-500">{user.email}</td>
                        <td className="text-gray-500">
                          {user.businessName || '-'}
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors.bg} ${roleColors.text}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                            {user.accountStatus}
                          </span>
                        </td>
                        <td>
                          <Badge variant={user.status ? 'success' : 'error'}>
                            {user.status ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="text-gray-500">{formatDateTime(user.createdAt)}</td>
                        <td>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {usersData.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-gray-500">
                    Showing page {usersData.page} of {usersData.totalPages} ({usersData.total} total users)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page === usersData.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
