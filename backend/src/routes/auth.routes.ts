import { Router } from 'express';
import { authController } from '../controllers';
import {
  authenticateToken,
  validate,
  registerUserRules,
  loginUserRules,
} from '../middleware';
import {
  authLimiter,
  registrationLimiter,
  passwordResetLimiter,
  checkAccountLock,
  requireStrongPassword,
} from '../middleware/security.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @security Rate limited to 3 registrations per hour per IP
 * @security Requires strong password
 */
router.post(
  '/register',
  registrationLimiter,
  validate(registerUserRules),
  requireStrongPassword,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return tokens
 * @access  Public
 * @security Rate limited to 5 attempts per 15 minutes per IP
 * @security Account lockout after 5 failed attempts
 */
router.post(
  '/login',
  authLimiter,
  checkAccountLock,
  validate(loginUserRules),
  authController.login
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticateToken,
  authController.getProfile
);

/**
 * @route   GET /api/auth/me
 * @desc    Alias for /profile - Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticateToken,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticateToken,
  authController.updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @security Requires strong password
 */
router.put(
  '/change-password',
  authenticateToken,
  requireStrongPassword,
  authController.changePassword
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public (with refresh token)
 */
router.post(
  '/refresh-token',
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticateToken,
  authController.logout
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @security Rate limited to 3 requests per hour per IP
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @security Rate limited to 3 requests per hour per IP
 * @security Requires strong password
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  requireStrongPassword,
  authController.resetPassword
);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address
 * @access  Public
 */
router.get(
  '/verify-email/:token',
  authController.verifyEmail
);

export default router;
