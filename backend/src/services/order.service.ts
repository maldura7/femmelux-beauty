import { Order, OrderStatus, PaymentStatus, Prisma, AccountStatus } from '@prisma/client';
import prisma from '../config/database';
import { ApiError } from '../middleware';
import { brandService } from './brand.service';

// Address type
interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Order item input
interface OrderItemInput {
  productId: string;
  quantity: number;
}

// Create order input
interface CreateOrderInput {
  items: OrderItemInput[];
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
}

// Type for order with relations
type OrderWithRelations = Order & {
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    businessName: string | null;
  };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: Prisma.Decimal;
    subtotal: Prisma.Decimal;
    product: {
      id: string;
      name: string;
      slug: string;
      sku: string;
      images: string[];
      brand: {
        id: string;
        name: string;
        slug: string;
      };
    };
  }>;
};

// Paginated orders response
interface PaginatedOrders {
  orders: OrderWithRelations[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Order filters
interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

class OrderService {
  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${dateStr}-${random}`;
  }

  /**
   * Calculate tax (example: 8% tax rate)
   */
  private calculateTax(subtotal: number): number {
    const TAX_RATE = 0.08;
    return Math.round(subtotal * TAX_RATE * 100) / 100;
  }

  /**
   * Calculate shipping (example: flat rate or free over threshold)
   */
  private calculateShipping(subtotal: number): number {
    const FREE_SHIPPING_THRESHOLD = 100;
    const FLAT_RATE = 9.99;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_RATE;
  }

  /**
   * Create a new order
   */
  async createOrder(
    customerId: string,
    orderData: CreateOrderInput
  ): Promise<OrderWithRelations> {
    const { items, shippingAddress, billingAddress, notes } = orderData;

    // Verify user is approved before creating order
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { accountStatus: true, role: true },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    // Only approved customers, vendors, and admins can place orders
    if (customer.role !== 'ADMIN' && customer.role !== 'VENDOR') {
      if (customer.accountStatus !== AccountStatus.APPROVED) {
        throw ApiError.forbidden(
          'Your account must be approved before placing orders. Please complete your business application.'
        );
      }
    }

    if (!items || items.length === 0) {
      throw ApiError.badRequest('Order must have at least one item');
    }

    // Get all products with their brands
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: true,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            minimumOrder: true,
          },
        },
      },
    });

    // Validate all products exist
    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      throw ApiError.badRequest(`Products not found: ${missingIds.join(', ')}`);
    }

    // Create product map for quick lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock and calculate totals
    const orderItems: Array<{
      productId: string;
      quantity: number;
      price: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId)!;

      if (product.quantity < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`
        );
      }

      const price = Number(product.wholesalePrice);
      const subtotal = price * item.quantity;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price,
        subtotal,
      });
    }

    // Validate minimum order requirements
    const minimumOrderErrors = await brandService.validateMinimumOrders(items);
    if (minimumOrderErrors.length > 0) {
      const errorMessages = minimumOrderErrors.map(
        (e) => `${e.brandName}: minimum $${e.minimumOrder}, current $${e.currentAmount}, need $${e.missingAmount} more`
      );
      throw ApiError.badRequest(
        `Minimum order requirements not met: ${errorMessages.join('; ')}`
      );
    }

    // Calculate order totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = this.calculateTax(subtotal);
    const shipping = this.calculateShipping(subtotal);
    const total = subtotal + tax + shipping;

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          subtotal,
          tax,
          shipping,
          total,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          shippingAddress: shippingAddress as unknown as Prisma.JsonObject,
          billingAddress: billingAddress as unknown as Prisma.JsonObject,
          notes,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              businessName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                  images: true,
                  brand: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Decrease product stock
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    return order as OrderWithRelations;
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<OrderWithRelations | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            businessName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: true,
                brand: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return order as OrderWithRelations | null;
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<OrderWithRelations | null> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            businessName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: true,
                brand: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return order as OrderWithRelations | null;
  }

  /**
   * Get orders by customer
   */
  async getOrdersByCustomer(
    customerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedOrders> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { customerId },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              businessName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                  images: true,
                  brand: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { customerId } }),
    ]);

    return {
      orders: orders as OrderWithRelations[],
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get orders containing products from a specific brand
   */
  async getOrdersByBrand(
    brandId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedOrders> {
    const skip = (page - 1) * limit;

    // Find orders that have items from this brand
    const whereClause: Prisma.OrderWhereInput = {
      items: {
        some: {
          product: {
            brandId,
          },
        },
      },
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              businessName: true,
            },
          },
          items: {
            where: {
              product: {
                brandId,
              },
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                  images: true,
                  brand: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    return {
      orders: orders as OrderWithRelations[],
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all orders with filters (admin)
   */
  async getAllOrders(filters: OrderFilters = {}): Promise<PaginatedOrders> {
    const {
      status,
      paymentStatus,
      customerId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.OrderWhereInput = {};

    if (status) {
      // Convert to uppercase for Prisma enum (e.g., 'pending' -> 'PENDING')
      whereClause.status = status.toUpperCase() as OrderStatus;
    }

    if (paymentStatus) {
      // Convert to uppercase for Prisma enum
      whereClause.paymentStatus = paymentStatus.toUpperCase() as PaymentStatus;
    }

    if (customerId) {
      whereClause.customerId = customerId;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = startDate;
      }
      if (endDate) {
        whereClause.createdAt.lte = endDate;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              businessName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                  images: true,
                  brand: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    return {
      orders: orders as OrderWithRelations[],
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus | string
  ): Promise<OrderWithRelations> {
    // Normalize status to uppercase for Prisma enum
    const normalizedStatus = (typeof newStatus === 'string' ? newStatus.toUpperCase() : newStatus) as OrderStatus;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Validate status transition
    const allowedTransitions = VALID_STATUS_TRANSITIONS[order.status];
    if (!allowedTransitions.includes(normalizedStatus)) {
      throw ApiError.badRequest(
        `Cannot transition from ${order.status} to ${normalizedStatus}. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: normalizedStatus },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            businessName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: true,
                brand: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return updatedOrder as OrderWithRelations;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    newPaymentStatus: PaymentStatus
  ): Promise<OrderWithRelations> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: newPaymentStatus },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            businessName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: true,
                brand: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return updatedOrder as OrderWithRelations;
  }

  /**
   * Cancel order and restore stock
   */
  async cancelOrder(orderId: string): Promise<OrderWithRelations> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Check if order can be cancelled
    if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status)) {
      throw ApiError.badRequest(
        `Cannot cancel order with status ${order.status}`
      );
    }

    // Cancel order and restore stock in transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const cancelled = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              businessName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  sku: true,
                  images: true,
                  brand: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Restore stock for each item
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }

      return cancelled;
    });

    return updatedOrder as OrderWithRelations;
  }

  /**
   * Add tracking number to order
   */
  async addTrackingNumber(
    orderId: string,
    trackingNumber: string
  ): Promise<OrderWithRelations> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { trackingNumber },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            businessName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: true,
                brand: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return updatedOrder as OrderWithRelations;
  }

  /**
   * Get order statistics
   */
  async getOrderStats(brandId?: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
  }> {
    const baseWhere: Prisma.OrderWhereInput = brandId
      ? {
          items: {
            some: {
              product: { brandId },
            },
          },
        }
      : {};

    const [total, pending, completed, cancelled, revenue] = await Promise.all([
      prisma.order.count({ where: baseWhere }),
      prisma.order.count({ where: { ...baseWhere, status: 'PENDING' } }),
      prisma.order.count({ where: { ...baseWhere, status: 'DELIVERED' } }),
      prisma.order.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
    ]);

    return {
      totalOrders: total,
      pendingOrders: pending,
      completedOrders: completed,
      cancelledOrders: cancelled,
      totalRevenue: Number(revenue._sum.total || 0),
    };
  }
}

export const orderService = new OrderService();
export default orderService;
