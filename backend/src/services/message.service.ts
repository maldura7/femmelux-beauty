import { PrismaClient, MessageStatus, MessagePriority, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

export interface CreateMessageData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  orderNumber?: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface MessageFilters {
  status?: MessageStatus;
  subject?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedMessages {
  messages: any[];
  total: number;
  page: number;
  pages: number;
}

export interface CreateReplyData {
  messageId: string;
  content: string;
  sentBy: string;
  sentByName: string;
}

// ============================================
// MESSAGE SERVICE CLASS
// ============================================

class MessageService {
  /**
   * Create a new contact message
   */
  async createMessage(data: CreateMessageData) {
    // Determine priority based on subject
    let priority: MessagePriority = MessagePriority.NORMAL;
    if (data.subject === 'order' || data.subject === 'returns') {
      priority = MessagePriority.HIGH;
    } else if (data.subject === 'partnership') {
      priority = MessagePriority.LOW;
    }

    const message = await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        orderNumber: data.orderNumber,
        message: data.message,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        priority,
        status: MessageStatus.UNREAD,
      },
    });

    return message;
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId: string) {
    const message = await prisma.contactMessage.findUnique({
      where: { id: messageId },
      include: {
        replies: {
          orderBy: { sentAt: 'asc' },
        },
      },
    });

    return message;
  }

  /**
   * Get all messages with filters and pagination
   */
  async getAllMessages(filters: MessageFilters = {}): Promise<PaginatedMessages> {
    const {
      status,
      subject,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = filters;

    // Build where clause
    const where: Prisma.ContactMessageWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (subject) {
      where.subject = subject;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.contactMessage.count({ where });

    // Get messages
    const messages = await prisma.contactMessage.findMany({
      where,
      include: {
        replies: {
          orderBy: { sentAt: 'desc' },
          take: 1, // Just get the latest reply
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      messages,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId: string, status: MessageStatus) {
    const message = await prisma.contactMessage.update({
      where: { id: messageId },
      data: { status },
    });

    return message;
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string) {
    return this.updateMessageStatus(messageId, MessageStatus.READ);
  }

  /**
   * Archive message
   */
  async archiveMessage(messageId: string) {
    return this.updateMessageStatus(messageId, MessageStatus.ARCHIVED);
  }

  /**
   * Bulk update message status
   */
  async bulkUpdateStatus(messageIds: string[], status: MessageStatus) {
    const result = await prisma.contactMessage.updateMany({
      where: { id: { in: messageIds } },
      data: { status },
    });

    return result;
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string) {
    await prisma.contactMessage.delete({
      where: { id: messageId },
    });
  }

  /**
   * Bulk delete messages
   */
  async bulkDeleteMessages(messageIds: string[]) {
    const result = await prisma.contactMessage.deleteMany({
      where: { id: { in: messageIds } },
    });

    return result;
  }

  /**
   * Create a reply to a message
   */
  async createReply(data: CreateReplyData) {
    const result = await prisma.$transaction(async (tx) => {
      // Create the reply
      const reply = await tx.messageReply.create({
        data: {
          messageId: data.messageId,
          content: data.content,
          sentBy: data.sentBy,
          sentByName: data.sentByName,
        },
      });

      // Update message status to REPLIED
      await tx.contactMessage.update({
        where: { id: data.messageId },
        data: { status: MessageStatus.REPLIED },
      });

      return reply;
    });

    return result;
  }

  /**
   * Get message statistics
   */
  async getMessageStats() {
    const [unread, read, replied, archived, total] = await Promise.all([
      prisma.contactMessage.count({ where: { status: MessageStatus.UNREAD } }),
      prisma.contactMessage.count({ where: { status: MessageStatus.READ } }),
      prisma.contactMessage.count({ where: { status: MessageStatus.REPLIED } }),
      prisma.contactMessage.count({ where: { status: MessageStatus.ARCHIVED } }),
      prisma.contactMessage.count(),
    ]);

    // Get today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await prisma.contactMessage.count({
      where: { createdAt: { gte: today } },
    });

    // Get messages by subject
    const subjects = await prisma.contactMessage.groupBy({
      by: ['subject'],
      _count: { subject: true },
    });

    return {
      unread,
      read,
      replied,
      archived,
      total,
      todayCount,
      bySubject: subjects.reduce((acc, item) => {
        acc[item.subject] = item._count.subject;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export const messageService = new MessageService();
