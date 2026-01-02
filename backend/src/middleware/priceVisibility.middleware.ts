import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AccountStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// PRICE VISIBILITY MIDDLEWARE
// ============================================

/**
 * Middleware to check if user can see wholesale prices
 * Sets req.canSeePrices based on user's authentication and account status
 */
export const checkPriceAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // If user is not authenticated, they cannot see prices
    if (!req.user) {
      req.canSeePrices = false;
      return next();
    }

    // Get user's current account status from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        accountStatus: true,
        role: true,
      },
    });

    // User not found in database
    if (!user) {
      req.canSeePrices = false;
      return next();
    }

    // Admins can always see prices
    if (user.role === 'ADMIN') {
      req.canSeePrices = true;
      return next();
    }

    // Vendors can see prices (they have their own products)
    if (user.role === 'VENDOR') {
      req.canSeePrices = true;
      return next();
    }

    // Approved customers can see prices
    if (user.accountStatus === AccountStatus.APPROVED) {
      req.canSeePrices = true;
      return next();
    }

    // All other statuses (GUEST, PENDING, REJECTED, SUSPENDED) cannot see prices
    req.canSeePrices = false;
    next();
  } catch (error) {
    console.error('Error in checkPriceAccess middleware:', error);
    // Default to not showing prices on error
    req.canSeePrices = false;
    next();
  }
};

/**
 * Optional middleware that allows prices for authenticated users
 * but also works for unauthenticated requests (public endpoints)
 */
export const checkPriceAccessOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // For routes where authentication is optional
  // Just call the main middleware
  return checkPriceAccess(req, res, next);
};
