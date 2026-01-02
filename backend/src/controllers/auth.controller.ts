import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler, ApiError } from '../middleware';
import { trackLoginAttempt } from '../middleware/security.middleware';

class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, firstName, lastName, role, businessName, taxId } = req.body;

    const user = await authService.register({
      email,
      password,
      firstName,
      lastName,
      role,
      businessName,
      taxId,
    });

    // Generate tokens for auto-login after registration
    const tokens = await authService.generateTokens(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  });

  /**
   * Login user
   * POST /api/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
      const result = await authService.login(email, password);

      // Track successful login attempt (clears failed attempts)
      trackLoginAttempt(email, true);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      // Track failed login attempt
      const attemptResult = trackLoginAttempt(email, false);

      if (attemptResult.locked) {
        throw ApiError.tooManyRequests(
          `Account temporarily locked. Please try again in ${attemptResult.lockTimeRemaining} minutes.`
        );
      }

      // Re-throw the original error with remaining attempts info
      if (error instanceof ApiError) {
        error.message = `${error.message}. ${attemptResult.remainingAttempts} attempts remaining.`;
      }
      throw error;
    }
  });

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const user = await authService.getUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  });

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { firstName, lastName, businessName, taxId } = req.body;

    const user = await authService.updateProfile(req.user.id, {
      firstName,
      lastName,
      businessName,
      taxId,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  });

  /**
   * Change password
   * PUT /api/auth/change-password
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Current password and new password are required');
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh-token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw ApiError.badRequest('Refresh token is required');
    }

    const tokens = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens,
    });
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    // In a more complete implementation, you might:
    // - Invalidate the refresh token in a blacklist
    // - Clear any server-side session

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  /**
   * Request password reset
   * POST /api/auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest('Email is required');
    }

    await authService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    });
  });

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw ApiError.badRequest('Token and new password are required');
    }

    await authService.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  });

  /**
   * Verify email
   * GET /api/auth/verify-email/:token
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;

    if (!token) {
      throw ApiError.badRequest('Verification token is required');
    }

    await authService.verifyEmail(token);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  });
}

export const authController = new AuthController();
export default authController;
