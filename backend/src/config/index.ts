import dotenv from 'dotenv';

dotenv.config();

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isStaging = nodeEnv === 'staging';

/**
 * Validate required environment variables for production
 */
const validateProductionConfig = (): void => {
  const requiredEnvVars = [
    'DATABASE_URL',
    // JWT secrets - check both possible names for compatibility
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for production: ${missingVars.join(', ')}`
    );
  }

  // Check for JWT secrets (support both naming conventions)
  const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || !jwtRefreshSecret) {
    console.warn('⚠️ JWT secrets not configured - using generated defaults. Set JWT_SECRET and JWT_REFRESH_SECRET for production.');
  }

  console.log('✅ Production environment configuration validated successfully');
};

// Run validation for production/staging environments
if (isProduction || isStaging) {
  validateProductionConfig();
}

// ============================================
// CONFIGURATION OBJECT
// ============================================

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv,
  isProduction,
  isStaging,
  isDevelopment: nodeEnv === 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // JWT - Support both naming conventions, with secure generated fallbacks
  jwtSecret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET ||
    (isProduction ? `prod-secret-${Date.now()}-${Math.random().toString(36)}` : 'dev-secret-not-for-production'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ||
    (isProduction ? `prod-refresh-${Date.now()}-${Math.random().toString(36)}` : 'dev-refresh-secret-not-for-production'),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // CORS - Strict in production
  corsOrigin: process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ||
    (isProduction ? [] : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173']),

  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(','),

  // Security Settings
  security: {
    // Rate limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    // Password requirements
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecial: true,

    // Account lockout
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDurationMs: parseInt(process.env.LOCKOUT_DURATION_MS || '900000', 10), // 15 minutes

    // Session
    sessionSecret: process.env.SESSION_SECRET || (isProduction ? '' : 'dev-session-secret'),
    cookieSecure: isProduction, // Only send cookies over HTTPS in production
    cookieSameSite: isProduction ? 'strict' : 'lax',
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
};

// ============================================
// CONFIGURATION LOGGING (Development only)
// ============================================

if (!isProduction && !isStaging) {
  console.log(`
📋 Configuration loaded:
   • Environment: ${config.nodeEnv}
   • Port: ${config.port}
   • Database: ${config.databaseUrl ? '✅ Configured' : '❌ Not configured'}
   • Redis: ${config.redisUrl}
   • CORS Origins: ${config.corsOrigin.join(', ') || 'None'}
  `);
}

export default config;
