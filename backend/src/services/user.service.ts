import { PrismaClient, Prisma, UserRole, AccountStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

export interface UserFilters {
  role?: UserRole;
  accountStatus?: AccountStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'firstName' | 'lastName' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedUsers {
  users: any[];
  total: number;
  page: number;
  pages: number;
}

export interface UserStats {
  total: number;
  customers: number;
  vendors: number;
  admins: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
}

// ============================================
// USER SERVICE CLASS
// ============================================

class UserService {
  /**
   * Get all users with filters and pagination
   */
  async getAllUsers(filters: UserFilters = {}): Promise<PaginatedUsers> {
    const {
      role,
      accountStatus,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (accountStatus) {
      where.accountStatus = accountStatus;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        accountStatus: true,
        businessName: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        approvedAt: true,
        rejectedAt: true,
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        accountStatus: true,
        businessName: true,
        businessType: true,
        phone: true,
        businessAddress: true,
        businessWebsite: true,
        businessYears: true,
        businessLicense: true,
        resaleCertificate: true,
        taxId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        appliedAt: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        suspendedAt: true,
        suspensionReason: true,
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        rejecter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    const [
      total,
      customers,
      vendors,
      admins,
      pending,
      approved,
      rejected,
      suspended,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'VENDOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { accountStatus: 'PENDING' } }),
      prisma.user.count({ where: { accountStatus: 'APPROVED' } }),
      prisma.user.count({ where: { accountStatus: 'REJECTED' } }),
      prisma.user.count({ where: { accountStatus: 'SUSPENDED' } }),
    ]);

    return {
      total,
      customers,
      vendors,
      admins,
      pending,
      approved,
      rejected,
      suspended,
    };
  }

  /**
   * Update user status (active/inactive)
   */
  async updateUserStatus(userId: string, status: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Cannot deactivate admin users
    if (user.role === 'ADMIN' && !status) {
      throw new Error('Cannot deactivate admin users');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: UserRole, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Cannot change own role
    if (userId === adminId) {
      throw new Error('Cannot change your own role');
    }

    // Cannot demote another admin (security measure)
    if (user.role === 'ADMIN' && role !== 'ADMIN') {
      throw new Error('Cannot demote admin users');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }
}

export const userService = new UserService();
