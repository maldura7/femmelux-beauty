import { Request, Response } from 'express';
import { messageService, CreateMessageData, MessageFilters } from '../services/message.service';
import { MessageStatus } from '@prisma/client';
import prisma from '../config/database';

// ============================================
// MESSAGE CONTROLLER
// ============================================

class MessageController {
  /**
   * Create a new contact message (public endpoint)
   * POST /api/messages
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const messageData: CreateMessageData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        subject: req.body.subject,
        orderNumber: req.body.orderNumber,
        message: req.body.message,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
      };

      // Validate required fields
      if (!messageData.name || !messageData.email || !messageData.subject || !messageData.message) {
        res.status(400).json({
          success: false,
          message: 'Name, email, subject, and message are required',
        });
        return;
      }

      const message = await messageService.createMessage(messageData);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully. We will respond within 24-48 hours.',
        data: { id: message.id },
      });
    } catch (error: any) {
      console.error('Error creating message:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send message',
      });
    }
  }

  /**
   * Get all messages (admin only)
   * GET /api/messages
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const filters: MessageFilters = {
        status: req.query.status as MessageStatus,
        subject: req.query.subject as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: (req.query.sortBy as 'createdAt' | 'updatedAt') || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        search: req.query.search as string,
      };

      const result = await messageService.getAllMessages(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch messages',
      });
    }
  }

  /**
   * Get message by ID (admin only)
   * GET /api/messages/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const message = await messageService.getMessageById(id);

      if (!message) {
        res.status(404).json({
          success: false,
          message: 'Message not found',
        });
        return;
      }

      // Mark as read if unread
      if (message.status === MessageStatus.UNREAD) {
        await messageService.markAsRead(id);
      }

      res.json({
        success: true,
        data: message,
      });
    } catch (error: any) {
      console.error('Error fetching message:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch message',
      });
    }
  }

  /**
   * Update message status (admin only)
   * PATCH /api/messages/:id/status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(MessageStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid status is required',
        });
        return;
      }

      const message = await messageService.updateMessageStatus(id, status);

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: message,
      });
    } catch (error: any) {
      console.error('Error updating message status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update status',
      });
    }
  }

  /**
   * Bulk update message status (admin only)
   * PATCH /api/messages/bulk/status
   */
  async bulkUpdateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { messageIds, status } = req.body;

      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Message IDs are required',
        });
        return;
      }

      if (!status || !Object.values(MessageStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Valid status is required',
        });
        return;
      }

      const result = await messageService.bulkUpdateStatus(messageIds, status);

      res.json({
        success: true,
        message: `${result.count} messages updated successfully`,
      });
    } catch (error: any) {
      console.error('Error bulk updating messages:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update messages',
      });
    }
  }

  /**
   * Delete message (admin only)
   * DELETE /api/messages/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await messageService.deleteMessage(id);

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting message:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete message',
      });
    }
  }

  /**
   * Bulk delete messages (admin only)
   * DELETE /api/messages/bulk
   */
  async bulkDelete(req: Request, res: Response): Promise<void> {
    try {
      const { messageIds } = req.body;

      if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Message IDs are required',
        });
        return;
      }

      const result = await messageService.bulkDeleteMessages(messageIds);

      res.json({
        success: true,
        message: `${result.count} messages deleted successfully`,
      });
    } catch (error: any) {
      console.error('Error bulk deleting messages:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete messages',
      });
    }
  }

  /**
   * Reply to a message (admin only)
   * POST /api/messages/:id/reply
   */
  async reply(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user?.id;

      if (!content) {
        res.status(400).json({
          success: false,
          message: 'Reply content is required',
        });
        return;
      }

      // Get user name from database
      let userName = 'Admin';
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        });
        if (user) {
          userName = `${user.firstName} ${user.lastName}`.trim() || 'Admin';
        }
      }

      // Verify message exists
      const message = await messageService.getMessageById(id);
      if (!message) {
        res.status(404).json({
          success: false,
          message: 'Message not found',
        });
        return;
      }

      const reply = await messageService.createReply({
        messageId: id,
        content,
        sentBy: userId || 'unknown',
        sentByName: userName,
      });

      res.status(201).json({
        success: true,
        message: 'Reply sent successfully',
        data: reply,
      });
    } catch (error: any) {
      console.error('Error sending reply:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send reply',
      });
    }
  }

  /**
   * Get message statistics (admin only)
   * GET /api/messages/stats
   */
  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await messageService.getMessageStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching message stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch stats',
      });
    }
  }
}

export const messageController = new MessageController();
