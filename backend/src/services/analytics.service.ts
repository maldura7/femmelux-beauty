import { PrismaClient, OrderStatus, Prisma } from '@prisma/client';
import { startOfDay, endOfDay, subDays, subMonths, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalCustomers: number;
  customersChange: number;
  totalProducts: number;
  productsChange: number;
  averageOrderValue: number;
  aovChange: number;
  pendingOrders: number;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface OrderStatusData {
  status: string;
  count: number;
  label: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  image: string | null;
  brand: {
    id: string;
    name: string;
  } | null;
  totalSold: number;
  revenue: number;
}

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  brandId?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}

// ============================================
// ANALYTICS SERVICE
// ============================================

class AnalyticsService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(filters?: AnalyticsFilters): Promise<DashboardStats> {
    const now = new Date();
    const currentPeriodStart = filters?.startDate || startOfDay(subDays(now, 30));
    const currentPeriodEnd = filters?.endDate || endOfDay(now);
    
    // Calculate previous period for comparison
    const periodLength = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
    const previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
    const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodLength);

    // Build where clause for orders
    const buildOrderWhere = (startDate: Date, endDate: Date): Prisma.OrderWhereInput => ({
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: { not: OrderStatus.CANCELLED },
      ...(filters?.brandId && {
        items: {
          some: {
            product: {
              brandId: filters.brandId,
            },
          },
        },
      }),
    });

    // Current period stats
    const currentOrders = await prisma.order.findMany({
      where: buildOrderWhere(currentPeriodStart, currentPeriodEnd),
      select: {
        total: true,
        customerId: true,
      },
    });

    // Previous period stats
    const previousOrders = await prisma.order.findMany({
      where: buildOrderWhere(previousPeriodStart, previousPeriodEnd),
      select: {
        total: true,
        customerId: true,
      },
    });

    // Calculate current period metrics
    const totalRevenue = currentOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = currentOrders.length;
    const uniqueCustomers = new Set(currentOrders.map(o => o.customerId)).size;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate previous period metrics
    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const previousOrderCount = previousOrders.length;
    const previousCustomers = new Set(previousOrders.map(o => o.customerId)).size;
    const previousAOV = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;

    // Calculate percentage changes
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const ordersChange = previousOrderCount > 0 
      ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 
      : 0;
    const customersChange = previousCustomers > 0 
      ? ((uniqueCustomers - previousCustomers) / previousCustomers) * 100 
      : 0;
    const aovChange = previousAOV > 0 
      ? ((averageOrderValue - previousAOV) / previousAOV) * 100 
      : 0;

    // Get total products count
    const totalProducts = await prisma.product.count({
      where: {
        status: true,
        ...(filters?.brandId && { brandId: filters.brandId }),
      },
    });

    // Get previous products count
    const previousProducts = await prisma.product.count({
      where: {
        status: true,
        createdAt: { lte: previousPeriodEnd },
        ...(filters?.brandId && { brandId: filters.brandId }),
      },
    });

    const productsChange = previousProducts > 0 
      ? ((totalProducts - previousProducts) / previousProducts) * 100 
      : 0;

    // Get pending orders count
    const pendingOrders = await prisma.order.count({
      where: {
        status: OrderStatus.PENDING,
        ...(filters?.brandId && {
          items: {
            some: {
              product: {
                brandId: filters.brandId,
              },
            },
          },
        }),
      },
    });

    return {
      totalRevenue,
      revenueChange: Math.round(revenueChange * 10) / 10,
      totalOrders,
      ordersChange: Math.round(ordersChange * 10) / 10,
      totalCustomers: uniqueCustomers,
      customersChange: Math.round(customersChange * 10) / 10,
      totalProducts,
      productsChange: Math.round(productsChange * 10) / 10,
      averageOrderValue,
      aovChange: Math.round(aovChange * 10) / 10,
      pendingOrders,
    };
  }

  /**
   * Get sales over time
   */
  async getSalesOverTime(filters?: AnalyticsFilters): Promise<SalesDataPoint[]> {
    const period = filters?.period || 'day';
    const endDate = filters?.endDate || new Date();
    
    // Determine start date based on period
    let startDate = filters?.startDate;
    if (!startDate) {
      switch (period) {
        case 'day':
          startDate = subDays(endDate, 30);
          break;
        case 'week':
          startDate = subDays(endDate, 90);
          break;
        case 'month':
          startDate = subMonths(endDate, 12);
          break;
        case 'year':
          startDate = subMonths(endDate, 36);
          break;
        default:
          startDate = subDays(endDate, 30);
      }
    }

    // Build where clause
    const whereClause: Prisma.OrderWhereInput = {
      status: { not: OrderStatus.CANCELLED },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(filters?.brandId && {
        items: {
          some: {
            product: {
              brandId: filters.brandId,
            },
          },
        },
      }),
    };

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Generate date intervals
    let intervals: Date[];
    let formatString: string;

    switch (period) {
      case 'week':
        intervals = eachWeekOfInterval({ start: startDate, end: endDate });
        formatString = 'yyyy-MM-dd';
        break;
      case 'month':
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        formatString = 'yyyy-MM';
        break;
      case 'year':
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
        formatString = 'yyyy';
        break;
      default: // day
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
        formatString = 'yyyy-MM-dd';
    }

    // Aggregate data by interval
    const dataMap = new Map<string, { revenue: number; orders: number }>();

    intervals.forEach(date => {
      const key = format(date, formatString);
      dataMap.set(key, { revenue: 0, orders: 0 });
    });

    orders.forEach(order => {
      const key = format(order.createdAt, formatString);
      const existing = dataMap.get(key) || { revenue: 0, orders: 0 };
      dataMap.set(key, {
        revenue: existing.revenue + Number(order.total),
        orders: existing.orders + 1,
      });
    });

    // Convert to array
    return Array.from(dataMap.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }));
  }

  /**
   * Get orders by status
   */
  async getOrdersByStatus(filters?: AnalyticsFilters): Promise<OrderStatusData[]> {
    const whereClause: Prisma.OrderWhereInput = {
      ...(filters?.startDate && filters?.endDate && {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
      ...(filters?.brandId && {
        items: {
          some: {
            product: {
              brandId: filters.brandId,
            },
          },
        },
      }),
    };

    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    const statusLabels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Pending',
      [OrderStatus.CONFIRMED]: 'Confirmed',
      [OrderStatus.PROCESSING]: 'Processing',
      [OrderStatus.SHIPPED]: 'Shipped',
      [OrderStatus.DELIVERED]: 'Delivered',
      [OrderStatus.CANCELLED]: 'Cancelled',
    };

    return statusCounts.map(item => ({
      status: item.status,
      count: item._count.id,
      label: statusLabels[item.status as OrderStatus] || item.status,
    }));
  }

  /**
   * Get top selling products
   */
  async getTopProducts(limit: number = 5, filters?: AnalyticsFilters): Promise<TopProduct[]> {
    const whereClause: Prisma.OrderWhereInput = {
      status: { not: OrderStatus.CANCELLED },
      ...(filters?.startDate && filters?.endDate && {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
      ...(filters?.brandId && {
        items: {
          some: {
            product: {
              brandId: filters.brandId,
            },
          },
        },
      }),
    };

    // Get order items with product details
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: whereClause,
      },
      select: {
        productId: true,
        quantity: true,
        price: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            images: true,
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Aggregate by product
    const productMap = new Map<string, {
      product: any;
      totalSold: number;
      revenue: number;
    }>();

    orderItems.forEach(item => {
      const existing = productMap.get(item.productId) || {
        product: item.product,
        totalSold: 0,
        revenue: 0,
      };

      productMap.set(item.productId, {
        product: item.product,
        totalSold: existing.totalSold + item.quantity,
        revenue: existing.revenue + (Number(item.price) * item.quantity),
      });
    });

    // Convert to array and sort by revenue
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(item => ({
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        image: item.product.images?.[0] || null,
        brand: item.product.brand,
        totalSold: item.totalSold,
        revenue: Math.round(item.revenue * 100) / 100,
      }));

    return topProducts;
  }
}

export default new AnalyticsService();
