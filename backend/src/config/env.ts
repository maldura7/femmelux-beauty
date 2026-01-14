import { z } from 'zod';

/**
 * Environment variable schema with validation
 * This ensures all required environment variables are set and valid
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(Number).default('4000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Cloudinary (optional in development)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Sentry (optional)
  SENTRY_DSN: z.string().optional(),

  // Redis (optional)
  REDIS_URL: z.string().optional(),

  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables at startup
 * Throws detailed error if validation fails
 */
export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
      console.error('\n❌ Environment validation failed:\n');
      console.error(missingVars);
      console.error('\nPlease check your .env file or environment variables.\n');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in staging
 */
export function isStaging(): boolean {
  return process.env.NODE_ENV === 'staging';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

/**
 * Get environment-specific config
 */
export function getEnvConfig() {
  const env = process.env.NODE_ENV || 'development';

  const configs = {
    development: {
      logLevel: 'debug',
      enableSwagger: true,
      enableCors: true,
      rateLimitWindow: 15 * 60 * 1000, // 15 minutes
      rateLimitMax: 1000, // requests per window
    },
    staging: {
      logLevel: 'info',
      enableSwagger: true,
      enableCors: true,
      rateLimitWindow: 15 * 60 * 1000,
      rateLimitMax: 500,
    },
    production: {
      logLevel: 'warn',
      enableSwagger: false,
      enableCors: true,
      rateLimitWindow: 15 * 60 * 1000,
      rateLimitMax: 100,
    },
  };

  return configs[env as keyof typeof configs] || configs.development;
}

export default {
  validateEnv,
  isProduction,
  isStaging,
  isDevelopment,
  getEnvConfig,
};
