import { Request, Response, NextFunction } from 'express';
import analyticsService from '../services/analytics.service';

// ============================================
// ANALYTICS CONTROLLER
// ============================================

class AnalyticsController {
  /**
   * @route   GET /api/analytics/dashboard
   * @desc    Get dashboard statistics
   * @access  Admin / Vendor
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, brandId } = req.query;

      const filters = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
        ...(brandId && { brandId: brandId as string }),
      };

      const stats = await analyticsService.getDashboardStats(filters);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/analytics/sales
   * @desc    Get sales over time
   * @access  Admin / Vendor
   */
  async getSalesOverTime(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, brandId, period } = req.query;

      const filters = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
        ...(brandId && { brandId: brandId as string }),
        ...(period && { period: period as 'day' | 'week' | 'month' | 'year' }),
      };

      const salesData = await analyticsService.getSalesOverTime(filters);

      res.json({
        success: true,
        data: salesData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/analytics/orders-by-status
   * @desc    Get orders grouped by status
   * @access  Admin / Vendor
   */
  async getOrdersByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, brandId } = req.query;

      const filters = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
        ...(brandId && { brandId: brandId as string }),
      };

      const ordersData = await analyticsService.getOrdersByStatus(filters);

      res.json({
        success: true,
        data: ordersData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/analytics/top-products
   * @desc    Get top selling products
   * @access  Admin / Vendor
   */
  async getTopProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, startDate, endDate, brandId } = req.query;

      const filters = {
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
        ...(brandId && { brandId: brandId as string }),
      };

      const topProducts = await analyticsService.getTopProducts(
        limit ? parseInt(limit as string) : 5,
        filters
      );

      res.json({
        success: true,
        data: topProducts,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
