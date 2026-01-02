import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole, AccountStatus } from '@prisma/client';
import prisma from '../config/database';
import { config } from '../config';
import { ApiError } from '../middleware';
import { emailService } from './email.service';

// Type for user without password
type SafeUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  brandId: string | null;
  businessName: string | null;
  taxId: string | null;
  accountStatus: AccountStatus;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  brand?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  } | null;
};

// JWT Payload type
interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Auth response type
interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

// Registration input type
interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  businessName?: string;
  taxId?: string;
}

class AuthService {
  private readonly SALT_ROUNDS = 10;

  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<SafeUser> {
    const { email, password, firstName, lastName, role = 'CUSTOMER', businessName, taxId } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user with GUEST account status (needs to submit application for approval)
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role,
        businessName,
        taxId,
        accountStatus: AccountStatus.GUEST, // New users start as GUEST
        status: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        brandId: true,
        businessName: true,
        taxId: true,
        accountStatus: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return user;
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.status) {
      throw ApiError.unauthorized('Your account has been deactivated');
    }

    // Check if user is suspended
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw ApiError.unauthorized('Your account has been suspended. Please contact support.');
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokensFromPayload({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password: _, ...safeUser } = user;

    return {
      user: safeUser,
      ...tokens,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        brandId: true,
        businessName: true,
        taxId: true,
        accountStatus: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      businessName?: string;
      taxId?: string;
    }
  ): Promise<SafeUser> {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        brandId: true,
        businessName: true,
        taxId: true,
        accountStatus: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as JwtPayload;

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.status) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      // Generate new tokens
      return this.generateTokensFromPayload({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Generate JWT tokens from payload
   */
  private generateTokensFromPayload(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
  }

  /**
   * Generate JWT tokens for a user by ID
   */
  async generateTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return this.generateTokensFromPayload({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }

  /**
   * Verify email (placeholder for email verification flow)
   */
  async verifyEmail(token: string): Promise<void> {
    // Implementation would depend on email verification strategy
    // This is a placeholder for the verification logic
    console.log('Verifying email with token:', token);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists - return silently
      return;
    }

    // Invalidate any existing reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // Send password reset email with the unhashed token
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't throw - we don't want to reveal if email sending failed
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the token in database
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetToken) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw ApiError.badRequest('Reset token has expired');
    }

    // Check if token has already been used
    if (resetToken.usedAt) {
      throw ApiError.badRequest('Reset token has already been used');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }
}

export const authService = new AuthService();
export default authService;
