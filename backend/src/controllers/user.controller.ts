import { Request, Response } from 'express';
import { userService } from '../services/user.service';

// ============================================
// USER CONTROLLER
// ============================================

class UserController {
  /**
   * Get all users with filters
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const {
        role,
        accountStatus,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await userService.getAllUsers({
        role: role as any,
        accountStatus: accountStatus as any,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.json({
        success: true,
        data: result.users,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit: limit ? parseInt(limit as string) : 20,
        },
      });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch users',
      });
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch user',
      });
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await userService.getUserStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch user statistics',
      });
    }
  }

  /**
   * Update user status (active/inactive)
   */
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (typeof status !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Status must be a boolean',
        });
        return;
      }

      const user = await userService.updateUserStatus(id, status);

      res.json({
        success: true,
        data: user,
        message: `User ${status ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating user status:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update user status',
      });
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!['ADMIN', 'VENDOR', 'CUSTOMER'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
        return;
      }

      const user = await userService.updateUserRole(id, role, adminId);

      res.json({
        success: true,
        data: user,
        message: 'User role updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update user role',
      });
    }
  }
}

export const userController = new UserController();
