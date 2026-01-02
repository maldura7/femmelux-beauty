'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  EnvelopeIcon,
  EnvelopeOpenIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { cn, formatDate } from '@/lib/utils';
import { getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

// Message types
interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  orderNumber?: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  replies?: any[];
}

interface MessageStats {
  total: number;
  unread: number;
  read: number;
  replied: number;
  archived: number;
  todayCount: number;
}

const subjectLabels: Record<string, string> = {
  general: 'General Inquiry',
  order: 'Order Support',
  shipping: 'Shipping & Delivery',
  returns: 'Returns & Refunds',
  account: 'Account Help',
  wholesale: 'Wholesale Application',
  products: 'Product Questions',
  partnership: 'Partnership & Collaboration',
  feedback: 'Feedback & Suggestions',
};

const subjectFilters = [
  { value: '', label: 'All Subjects' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'order', label: 'Order Support' },
  { value: 'shipping', label: 'Shipping & Delivery' },
  { value: 'returns', label: 'Returns & Refunds' },
  { value: 'account', label: 'Account Help' },
  { value: 'wholesale', label: 'Wholesale Application' },
  { value: 'products', label: 'Product Questions' },
  { value: 'partnership', label: 'Partnership & Collaboration' },
  { value: 'feedback', label: 'Feedback & Suggestions' },
];

const statusFilters = [
  { value: '', label: 'All Status' },
  { value: 'UNREAD', label: 'Unread' },
  { value: 'READ', label: 'Read' },
  { value: 'REPLIED', label: 'Replied' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<MessageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMessages = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (subjectFilter) params.append('subject', subjectFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages);
        setTotalPages(data.data.pages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, subjectFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [fetchMessages, fetchStats]);

  // Handlers
  const toggleSelectMessage = (id: string) => {
    setSelectedMessages((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMessages.length === messages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map((m) => m.id));
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    const token = getToken();
    if (!token || selectedMessages.length === 0) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/bulk/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageIds: selectedMessages,
            status,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setSelectedMessages([]);
        fetchMessages();
        fetchStats();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update messages');
    }
  };

  const bulkDelete = async () => {
    const token = getToken();
    if (!token || selectedMessages.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedMessages.length} message(s)?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/bulk`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageIds: selectedMessages,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setSelectedMessages([]);
        fetchMessages();
        fetchStats();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete messages');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return <EnvelopeIcon className="w-4 h-4 text-primary-600" />;
      case 'READ':
        return <EnvelopeOpenIcon className="w-4 h-4 text-gray-400" />;
      case 'REPLIED':
        return <CheckIcon className="w-4 h-4 text-green-600" />;
      case 'ARCHIVED':
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getSubjectLabel = (subject: string) => {
    return subjectLabels[subject] || subject;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer inquiries and support requests
          </p>
        </div>
        <button
          onClick={() => {
            fetchMessages();
            fetchStats();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <EnvelopeIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
              <p className="text-sm text-gray-500">Total Messages</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.unread || 0}</p>
              <p className="text-sm text-gray-500">Unread</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.replied || 0}</p>
              <p className="text-sm text-gray-500">Replied</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.todayCount || 0}</p>
              <p className="text-sm text-gray-500">Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {subjectFilters.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              {statusFilters.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedMessages.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedMessages.length} selected
            </span>
            <button
              onClick={() => bulkUpdateStatus('READ')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Mark as Read
            </button>
            <button
              onClick={() => bulkUpdateStatus('ARCHIVED')}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Archive
            </button>
            <button
              onClick={bulkDelete}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selectedMessages.length === messages.length && messages.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          </div>
          <div className="col-span-3">From</div>
          <div className="col-span-2">Subject</div>
          <div className="col-span-4">Message</div>
          <div className="col-span-2 text-right">Date</div>
        </div>

        {/* Messages */}
        {loading ? (
          <div className="px-6 py-12 text-center">
            <ArrowPathIcon className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <EnvelopeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No messages found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'px-6 py-4 hover:bg-gray-50 transition-colors',
                  msg.status === 'UNREAD' && 'bg-primary-50/50'
                )}
              >
                <div className="lg:grid lg:grid-cols-12 gap-4 items-center">
                  {/* Checkbox */}
                  <div className="hidden lg:flex col-span-1 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMessages.includes(msg.id)}
                      onChange={() => toggleSelectMessage(msg.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    {getStatusIcon(msg.status)}
                  </div>

                  {/* From */}
                  <div className="col-span-3 mb-2 lg:mb-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'font-medium text-gray-900',
                        msg.status === 'UNREAD' && 'font-semibold'
                      )}>
                        {msg.name}
                      </p>
                      {msg.priority === 'HIGH' || msg.priority === 'URGENT' ? (
                        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">
                          {msg.priority === 'URGENT' ? 'Urgent' : 'High'}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-500">{msg.email}</p>
                  </div>

                  {/* Subject */}
                  <div className="col-span-2 mb-2 lg:mb-0">
                    <span className={cn(
                      'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                      msg.subject === 'order' && 'bg-orange-100 text-orange-700',
                      msg.subject === 'wholesale' && 'bg-purple-100 text-purple-700',
                      msg.subject === 'partnership' && 'bg-blue-100 text-blue-700',
                      msg.subject === 'returns' && 'bg-red-100 text-red-700',
                      msg.subject === 'products' && 'bg-green-100 text-green-700',
                      !['order', 'wholesale', 'partnership', 'returns', 'products'].includes(msg.subject) && 'bg-gray-100 text-gray-700'
                    )}>
                      {getSubjectLabel(msg.subject)}
                    </span>
                    {msg.orderNumber && (
                      <p className="text-xs text-gray-500 mt-1">#{msg.orderNumber}</p>
                    )}
                  </div>

                  {/* Message Preview */}
                  <div className="col-span-4 mb-2 lg:mb-0">
                    <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                  </div>

                  {/* Date & Actions */}
                  <div className="col-span-2 flex items-center justify-between lg:justify-end gap-3">
                    <span className="text-sm text-gray-500">
                      {formatDate(msg.createdAt)}
                    </span>
                    <Link
                      href={`/dashboard/messages/${msg.id}`}
                      className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
