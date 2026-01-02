import { Request, Response } from 'express';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { orderService } from '../services/order.service';
import { asyncHandler, ApiError } from '../middleware';

// Transform order data to flatten items for frontend consumption
function transformOrder(order: any) {
  return {
    ...order,
    // Map customer to user for frontend compatibility
    user: order.customer,
    items: order.items?.map((item: any) => ({
      ...item,
      // Flatten product fields
      productName: item.product?.name,
      productImage: item.product?.images?.[0],
      sku: item.product?.sku,
      // Make brand directly accessible
      brand: item.product?.brand,
      // Map subtotal to total for consistency
      total: item.subtotal,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
    })),
    // Convert Decimal fields to numbers
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shipping: Number(order.shipping),
    total: Number(order.total),
  };
}

function transformOrders(orders: any[]) {
  return orders.map(transformOrder);
}

class OrderController {
  /**
   * Create a new order
   * POST /api/orders
   * Customer only
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { items, shippingAddress, billingAddress, notes } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw ApiError.badRequest('Order must have at least one item');
    }

    if (!shippingAddress) {
      throw ApiError.badRequest('Shipping address is required');
    }

    if (!billingAddress) {
      throw ApiError.badRequest('Billing address is required');
    }

    // Normalize address fields (frontend may send postalCode, backend expects zipCode)
    const normalizeAddress = (addr: any) => ({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode || addr.postalCode,
      country: addr.country,
    });

    const order = await orderService.createOrder(req.user.id, {
      items,
      shippingAddress: normalizeAddress(shippingAddress),
      billingAddress: normalizeAddress(billingAddress),
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order: transformOrder(order) },
    });
  });

  /**
   * Get order by ID
   * GET /api/orders/:id
   * Owner, vendor (if contains their brand products), or admin
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { id } = req.params;

    const order = await orderService.getOrderById(id);

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Authorization check
    if (req.user.role === 'CUSTOMER') {
      // Customers can only see their own orders
      if (order.customerId !== req.user.id) {
        throw ApiError.forbidden('You do not have permission to view this order');
      }
    } else if (req.user.role === 'VENDOR') {
      // Vendors can only see orders containing their brand's products
      const hasBrandProducts = order.items.some(
        (item) => item.product.brand.id === req.user?.brandId
      );
      if (!hasBrandProducts) {
        throw ApiError.forbidden('You do not have permission to view this order');
      }
    }
    // Admins can see all orders

    res.status(200).json({
      success: true,
      data: { order: transformOrder(order) },
    });
  });

  /**
   * Get order by order number
   * GET /api/orders/number/:orderNumber
   * Owner, vendor (if contains their brand products), or admin
   */
  getByNumber = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { orderNumber } = req.params;

    const order = await orderService.getOrderByNumber(orderNumber);

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    // Authorization check
    if (req.user.role === 'CUSTOMER') {
      if (order.customerId !== req.user.id) {
        throw ApiError.forbidden('You do not have permission to view this order');
      }
    } else if (req.user.role === 'VENDOR') {
      const hasBrandProducts = order.items.some(
        (item) => item.product.brand.id === req.user?.brandId
      );
      if (!hasBrandProducts) {
        throw ApiError.forbidden('You do not have permission to view this order');
      }
    }

    res.status(200).json({
      success: true,
      data: { order: transformOrder(order) },
    });
  });

  /**
   * Get current user's orders
   * GET /api/orders/my
   * Customer only
   */
  getMyOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await orderService.getOrdersByCustomer(req.user.id, page, limit);

    res.status(200).json({
      success: true,
      data: {
        orders: transformOrders(result.orders),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
          hasNextPage: result.page < result.pages,
          hasPrevPage: result.page > 1,
        },
      },
    });
  });

  /**
   * Get orders for a brand
   * GET /api/brands/:brandId/orders
   * Vendor (own brand) or admin
   */
  getBrandOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { brandId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    // Vendors can only see their own brand's orders
    if (req.user.role === 'VENDOR') {
      if (req.user.brandId !== brandId) {
        throw ApiError.forbidden('You can only view orders for your own brand');
      }
    }

    const result = await orderService.getOrdersByBrand(brandId, page, limit);

    res.status(200).json({
      success: true,
      data: {
        orders: transformOrders(result.orders),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
          hasNextPage: result.page < result.pages,
          hasPrevPage: result.page > 1,
        },
      },
    });
  });

  /**
   * Get all orders (admin)
   * GET /api/orders
   * Admin only
   */
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      status,
      paymentStatus,
      customerId,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const filters = {
      status: status as OrderStatus,
      paymentStatus: paymentStatus as PaymentStatus,
      customerId: customerId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    };

    const result = await orderService.getAllOrders(filters);

    res.status(200).json({
      success: true,
      data: {
        orders: transformOrders(result.orders),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.pages,
          hasNextPage: result.page < result.pages,
          hasPrevPage: result.page > 1,
        },
      },
    });
  });

  /**
   * Update order status
   * PATCH /api/orders/:id/status
   * Vendor (own brand products) or admin
   */
  updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw ApiError.badRequest('Status is required');
    }

    // Validate status value
    const validStatuses: OrderStatus[] = [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Get order to check authorization
    const existingOrder = await orderService.getOrderById(id);

    if (!existingOrder) {
      throw ApiError.notFound('Order not found');
    }

    // Vendors can only update orders containing their brand's products
    if (req.user.role === 'VENDOR') {
      const hasBrandProducts = existingOrder.items.some(
        (item) => item.product.brand.id === req.user?.brandId
      );
      if (!hasBrandProducts) {
        throw ApiError.forbidden('You can only update orders containing your brand products');
      }
    }

    const order = await orderService.updateOrderStatus(id, status);

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { order: transformOrder(order) },
    });
  });

  /**
   * Update payment status
   * PATCH /api/orders/:id/payment-status
   * Admin only
   */
  updatePaymentStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!paymentStatus) {
      throw ApiError.badRequest('Payment status is required');
    }

    const validStatuses: PaymentStatus[] = ['PENDING', 'PAID', 'FAILED'];
    if (!validStatuses.includes(paymentStatus)) {
      throw ApiError.badRequest(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const order = await orderService.updatePaymentStatus(id, paymentStatus);

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: { order: transformOrder(order) },
    });
  });

  /**
   * Cancel an order
   * POST /api/orders/:id/cancel
   * Customer (own order) or admin
   */
  cancel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { id } = req.params;

    // Get order to check authorization
    const existingOrder = await orderService.getOrderById(id);

    if (!existingOrder) {
      throw ApiError.notFound('Order not found');
    }

    // Customers can only cancel their own orders
    if (req.user.role === 'CUSTOMER') {
      if (existingOrder.customerId !== req.user.id) {
        throw ApiError.forbidden('You can only cancel your own orders');
      }
    }

    // Vendors cannot cancel orders
    if (req.user.role === 'VENDOR') {
      throw ApiError.forbidden('Vendors cannot cancel orders');
    }

    const order = await orderService.cancelOrder(id);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order: transformOrder(order) },
    });
  });

  /**
   * Add tracking number
   * PATCH /api/orders/:id/tracking
   * Vendor (own brand products) or admin
   */
  addTracking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { id } = req.params;
    const { trackingNumber } = req.body;

    if (!trackingNumber) {
      throw ApiError.badRequest('Tracking number is required');
    }

    // Get order to check authorization
    const existingOrder = await orderService.getOrderById(id);

    if (!existingOrder) {
      throw ApiError.notFound('Order not found');
    }

    // Vendors can only update orders containing their brand's products
    if (req.user.role === 'VENDOR') {
      const hasBrandProducts = existingOrder.items.some(
        (item) => item.product.brand.id === req.user?.brandId
      );
      if (!hasBrandProducts) {
        throw ApiError.forbidden('You can only update orders containing your brand products');
      }
    }

    const order = await orderService.addTrackingNumber(id, trackingNumber);

    res.status(200).json({
      success: true,
      message: 'Tracking number added successfully',
      data: { order: transformOrder(order) },
    });
  });

  /**
   * Get order statistics
   * GET /api/orders/stats
   * Vendor (own brand) or admin
   */
  getStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    let brandId: string | undefined;

    // Vendors can only see stats for their brand
    if (req.user.role === 'VENDOR') {
      if (!req.user.brandId) {
        throw ApiError.forbidden('You are not assigned to any brand');
      }
      brandId = req.user.brandId;
    } else if (req.query.brandId) {
      brandId = req.query.brandId as string;
    }

    const stats = await orderService.getOrderStats(brandId);

    res.status(200).json({
      success: true,
      data: { stats },
    });
  });
}

export const orderController = new OrderController();
export default orderController;
