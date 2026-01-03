'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getPath } from '@/lib/navigation';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  ClockIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { cn, formatDate } from '@/lib/utils';
import { getToken } from '@/lib/auth';
import toast from 'react-hot-toast';

// Message type
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
  replies?: Reply[];
}

interface Reply {
  id: string;
  content: string;
  sentAt: string;
  sentBy: string;
  sentByName: string;
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

// Quick reply templates
const replyTemplates = [
  {
    id: 'wholesale',
    name: 'Wholesale Info',
    content: `Hi {{name}},

Thank you for your interest in becoming a FemmeLux Beauty wholesale partner!

To get started with your wholesale account, please visit our wholesale application page at femmeluxbeauty.com/apply. You'll need to provide:
- Valid business license
- Tax ID / Resale certificate
- Business contact information

Once approved, you'll have access to:
- Wholesale pricing (30-50% below retail)
- Volume discounts on orders over $1,000
- Priority customer support
- Early access to new products

If you have any questions about the application process, please don't hesitate to reach out.

Best regards,
FemmeLux Beauty Team`,
  },
  {
    id: 'order-status',
    name: 'Order Status',
    content: `Hi {{name}},

Thank you for reaching out about your order.

I've checked the status of order {{orderNumber}} and [ORDER STATUS HERE].

[TRACKING INFO IF AVAILABLE]

If you have any other questions, please let me know.

Best regards,
FemmeLux Beauty Team`,
  },
  {
    id: 'returns',
    name: 'Returns Process',
    content: `Hi {{name}},

I'm sorry to hear about the issue with your order. We want to make this right for you.

To process your return/replacement, please:
1. Take photos of the damaged item and packaging
2. Reply to this email with the photos attached
3. Include your order number for reference

Once we receive the photos, we'll process your replacement or refund within 1-2 business days.

We apologize for any inconvenience this has caused.

Best regards,
FemmeLux Beauty Team`,
  },
  {
    id: 'general',
    name: 'General Response',
    content: `Hi {{name}},

Thank you for contacting FemmeLux Beauty.

[YOUR RESPONSE HERE]

If you have any other questions, please don't hesitate to reach out.

Best regards,
FemmeLux Beauty Team`,
  },
];

export default function MessageDetailPage() {
  const params = useParams();
  const messageId = params.id as string;

  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const fetchMessage = useCallback(async () => {
    const token = getToken();
    if (!token || !messageId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage(data.data);
      } else {
        toast.error('Message not found');
        window.location.href = getPath('/dashboard/messages');
      }
    } catch (error) {
      console.error('Error fetching message:', error);
      toast.error('Failed to load message');
    } finally {
      setLoading(false);
    }
  }, [messageId]);

  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  const handleSendReply = async () => {
    const token = getToken();
    if (!token || !message || !replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: replyText }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Reply sent successfully!');
        setReplyText('');
        fetchMessage(); // Refresh to show the new reply
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleUseTemplate = (template: typeof replyTemplates[0]) => {
    if (!message) return;
    let content = template.content;
    content = content.replace('{{name}}', message.name.split(' ')[0]);
    if (message.orderNumber) {
      content = content.replace('{{orderNumber}}', message.orderNumber);
    }
    setReplyText(content);
    setShowTemplates(false);
  };

  const handleArchive = async () => {
    const token = getToken();
    if (!token || !message) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'ARCHIVED' }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Message archived');
        setMessage({ ...message, status: 'ARCHIVED' });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to archive message');
    }
  };

  const handleDelete = async () => {
    const token = getToken();
    if (!token || !confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('Message deleted');
        window.location.href = getPath('/dashboard/messages');
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete message');
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case 'order':
        return 'bg-orange-100 text-orange-700';
      case 'wholesale':
        return 'bg-purple-100 text-purple-700';
      case 'partnership':
        return 'bg-blue-100 text-blue-700';
      case 'returns':
        return 'bg-red-100 text-red-700';
      case 'products':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSubjectLabel = (subject: string) => {
    return subjectLabels[subject] || subject;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Message not found</p>
        <a
          href={getPath('/dashboard/messages')}
          className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Messages
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <a
            href={getPath('/dashboard/messages')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
          </a>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Message from {message.name}</h1>
            <p className="text-sm text-gray-500">
              Received {formatDate(message.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleArchive}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Archive"
          >
            <ArchiveBoxIcon className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <TrashIcon className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original Message */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {message.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{message.name}</p>
                  <p className="text-sm text-gray-500">{message.email}</p>
                </div>
              </div>
              <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getSubjectColor(message.subject))}>
                {getSubjectLabel(message.subject)}
              </span>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {formatDate(message.createdAt)}
              </span>
              {(message.priority === 'HIGH' || message.priority === 'URGENT') && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                  {message.priority === 'URGENT' ? 'Urgent' : 'High Priority'}
                </span>
              )}
            </div>
          </div>

          {/* Previous Replies */}
          {message.replies && message.replies.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Conversation History
              </h3>
              {message.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="bg-primary-50 border border-primary-100 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">FL</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">FemmeLux Beauty</p>
                        <p className="text-sm text-gray-500">Sent by {reply.sentByName}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircleIcon className="w-4 h-4" />
                      Sent
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                  <p className="mt-3 text-sm text-gray-500">
                    {formatDate(reply.sentAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Reply Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Send Reply</h3>
              <div className="relative">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Use Template
                </button>
                {showTemplates && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    {replyTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleUseTemplate(template)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={8}
              placeholder="Type your reply here..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Reply will be sent to: <span className="font-medium">{message.email}</span>
              </p>
              <button
                onClick={handleSendReply}
                disabled={isSending || !replyText.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{message.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a
                    href={`mailto:${message.email}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {message.email}
                  </a>
                </div>
              </div>

              {message.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <PhoneIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <a
                      href={`tel:${message.phone}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      {message.phone}
                    </a>
                  </div>
                </div>
              )}

              {message.orderNumber && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingBagIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Order Number</p>
                    <a
                      href={getPath(`/dashboard/orders?search=${message.orderNumber}`)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      {message.orderNumber}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Message Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Message Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  message.status === 'UNREAD' && 'bg-primary-100 text-primary-700',
                  message.status === 'READ' && 'bg-gray-100 text-gray-700',
                  message.status === 'REPLIED' && 'bg-green-100 text-green-700',
                  message.status === 'ARCHIVED' && 'bg-gray-100 text-gray-500'
                )}>
                  {message.status.charAt(0) + message.status.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Priority</span>
                <span className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  (message.priority === 'HIGH' || message.priority === 'URGENT') && 'bg-red-100 text-red-700',
                  message.priority === 'NORMAL' && 'bg-blue-100 text-blue-700',
                  message.priority === 'LOW' && 'bg-gray-100 text-gray-600'
                )}>
                  {message.priority.charAt(0) + message.priority.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Received</span>
                <span className="text-sm text-gray-900">
                  {formatDate(message.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <a
                href={`mailto:${message.email}`}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <EnvelopeIcon className="w-4 h-4" />
                Send Email Directly
              </a>
              {message.phone && (
                <a
                  href={`tel:${message.phone}`}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <PhoneIcon className="w-4 h-4" />
                  Call Customer
                </a>
              )}
              {message.orderNumber && (
                <a
                  href={getPath(`/dashboard/orders?search=${message.orderNumber}`)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ShoppingBagIcon className="w-4 h-4" />
                  View Order
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
