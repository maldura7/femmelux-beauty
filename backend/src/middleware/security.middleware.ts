import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

// ============================================
// RATE LIMITING CONFIGURATIONS
// ============================================

/**
 * General API rate limiter
 * Limits: 1000 requests per 15 minutes per IP in development, 100 in production
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in development
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Limits: 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Password reset rate limiter
 * Limits: 3 requests per hour per IP in production, 50 in development
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 3 : 50, // More lenient in development
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Account creation rate limiter
 * Limits: 50 accounts per hour per IP in development, 3 in production
 */
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 3 : 50, // More lenient in development
  message: {
    success: false,
    message: 'Too many accounts created, please try again after 1 hour.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API heavy operations limiter (file uploads, bulk operations)
 * Limits: 10 requests per minute per IP
 */
export const heavyOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    message: 'Too many requests, please slow down.',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// FAILED LOGIN TRACKING
// ============================================

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

// In-memory store for login attempts (consider using Redis in production)
const loginAttempts: Map<string, LoginAttempt> = new Map();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

/**
 * Track failed login attempts and lock accounts temporarily
 */
export const trackLoginAttempt = (email: string, success: boolean): { locked: boolean; remainingAttempts: number; lockTimeRemaining?: number } => {
  const key = email.toLowerCase();
  const now = Date.now();

  let attempt = loginAttempts.get(key);

  // Check if currently locked
  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    return {
      locked: true,
      remainingAttempts: 0,
      lockTimeRemaining: Math.ceil((attempt.lockedUntil - now) / 1000 / 60), // minutes
    };
  }

  if (success) {
    // Clear attempts on successful login
    loginAttempts.delete(key);
    return { locked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  // Reset if outside attempt window
  if (!attempt || (now - attempt.lastAttempt) > ATTEMPT_WINDOW) {
    attempt = { count: 0, lastAttempt: now };
  }

  attempt.count++;
  attempt.lastAttempt = now;

  // Lock account if max attempts reached
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.lockedUntil = now + LOCK_TIME;
    loginAttempts.set(key, attempt);
    return {
      locked: true,
      remainingAttempts: 0,
      lockTimeRemaining: Math.ceil(LOCK_TIME / 1000 / 60),
    };
  }

  loginAttempts.set(key, attempt);
  return {
    locked: false,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.count,
  };
};

/**
 * Check if account is locked
 */
export const isAccountLocked = (email: string): { locked: boolean; lockTimeRemaining?: number } => {
  const key = email.toLowerCase();
  const attempt = loginAttempts.get(key);
  const now = Date.now();

  if (attempt?.lockedUntil && attempt.lockedUntil > now) {
    return {
      locked: true,
      lockTimeRemaining: Math.ceil((attempt.lockedUntil - now) / 1000 / 60),
    };
  }

  return { locked: false };
};

/**
 * Middleware to check if account is locked before login attempt
 */
export const checkAccountLock = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;

  if (!email) {
    next();
    return;
  }

  const lockStatus = isAccountLocked(email);

  if (lockStatus.locked) {
    res.status(429).json({
      success: false,
      message: `Account temporarily locked due to too many failed login attempts. Please try again in ${lockStatus.lockTimeRemaining} minutes.`,
      lockTimeRemaining: lockStatus.lockTimeRemaining,
    });
    return;
  }

  next();
};

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return input;

  return sanitizeHtml(input, {
    allowedTags: [], // Strip all HTML tags
    allowedAttributes: {},
    textFilter: (text) => {
      // Remove potential script injections
      return text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    },
  });
};

/**
 * Recursively sanitize object properties
 */
export const sanitizeObject = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeInput(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T;
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized as T;
  }

  return obj;
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQuery = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query) as typeof req.query;
  }
  next();
};

// ============================================
// PASSWORD STRENGTH VALIDATION
// ============================================

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0-5
  errors: string[];
  suggestions: string[];
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePasswordStrength = (password: string): PasswordStrengthResult => {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  if (!password) {
    return {
      isValid: false,
      score: 0,
      errors: ['Password is required'],
      suggestions: ['Please enter a password'],
    };
  }

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score++;
    if (password.length >= 12) {
      score++;
      suggestions.push('Great password length!');
    }
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score++;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score++;
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score++;
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  } else {
    score++;
  }

  // Common password patterns check
  const commonPatterns = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome'];
  const lowerPassword = password.toLowerCase();
  for (const pattern of commonPatterns) {
    if (lowerPassword.includes(pattern)) {
      errors.push('Password contains common patterns that are easy to guess');
      score = Math.max(0, score - 2);
      break;
    }
  }

  // Suggestions based on score
  if (score < 3) {
    suggestions.push('Consider using a mix of uppercase, lowercase, numbers, and special characters');
  }
  if (password.length < 12 && !suggestions.includes('Great password length!')) {
    suggestions.push('Consider using 12 or more characters for a stronger password');
  }

  return {
    isValid: errors.length === 0,
    score: Math.min(5, score),
    errors,
    suggestions,
  };
};

/**
 * Middleware to validate password strength on registration/password change
 */
export const requireStrongPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { password } = req.body;

  if (!password) {
    next();
    return;
  }

  const result = validatePasswordStrength(password);

  if (!result.isValid) {
    res.status(400).json({
      success: false,
      message: 'Password does not meet security requirements',
      errors: result.errors,
      suggestions: result.suggestions,
      passwordStrength: result.score,
    });
    return;
  }

  next();
};

// ============================================
// SQL INJECTION PREVENTION
// ============================================

/**
 * Check for potential SQL injection patterns
 * Note: Be careful not to block legitimate business text
 */
export const containsSqlInjection = (input: string): boolean => {
  if (typeof input !== 'string') return false;

  // Only check for dangerous SQL patterns that are unlikely in normal text
  const sqlPatterns = [
    // Dangerous SQL commands with suspicious context
    /;\s*(DROP|DELETE|TRUNCATE|ALTER)\s+/i,
    /UNION\s+(ALL\s+)?SELECT/i,
    /INSERT\s+INTO/i,
    /UPDATE\s+\w+\s+SET/i,
    // SQL comments used for injection
    /('|")\s*;\s*--/,
    /(\/\*.*\*\/)/,
    // Classic injection patterns
    /'\s*OR\s+'?1'?\s*=\s*'?1/i,
    /'\s*OR\s+''='/i,
    /1\s*=\s*1\s*(--|;|\/\*)/i,
    // Script injection
    /<script[\s>]/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
};

/**
 * Middleware to check for SQL injection attempts
 */
export const preventSqlInjection = (req: Request, res: Response, next: NextFunction): void => {
  const checkValue = (value: unknown, path: string): boolean => {
    if (typeof value === 'string' && containsSqlInjection(value)) {
      console.warn(`Potential SQL injection detected in ${path}: ${value.substring(0, 50)}...`);
      return true;
    }
    if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        if (checkValue(val, `${path}.${key}`)) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkValue(req.body, 'body') || checkValue(req.query, 'query') || checkValue(req.params, 'params')) {
    res.status(400).json({
      success: false,
      message: 'Invalid input detected',
    });
    return;
  }

  next();
};

// ============================================
// SECURITY HEADERS HELPER
// ============================================

/**
 * Custom security headers middleware (complements Helmet)
 */
export const customSecurityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Prevent browsers from MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

// ============================================
// EXPORTS
// ============================================

export default {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  registrationLimiter,
  heavyOperationLimiter,
  trackLoginAttempt,
  isAccountLocked,
  checkAccountLock,
  sanitizeBody,
  sanitizeQuery,
  sanitizeInput,
  sanitizeObject,
  validatePasswordStrength,
  requireStrongPassword,
  containsSqlInjection,
  preventSqlInjection,
  customSecurityHeaders,
};
