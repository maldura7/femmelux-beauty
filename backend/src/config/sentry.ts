import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry error monitoring
 * Only initializes if SENTRY_DSN is set
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log('[Sentry] Not configured - set SENTRY_DSN to enable error monitoring');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Only send errors in production
    enabled: process.env.NODE_ENV === 'production' || process.env.SENTRY_DEBUG === 'true',

    // Filter out non-error events in development
    beforeSend(event, hint) {
      // Don't send 4xx errors to Sentry (user errors, not system errors)
      const statusCode = (hint.originalException as any)?.statusCode;
      if (statusCode && statusCode >= 400 && statusCode < 500) {
        return null;
      }
      return event;
    },

    // Integrations
    integrations: [
      // Enable HTTP request tracing
      Sentry.httpIntegration(),
      // Capture unhandled promise rejections
      Sentry.onUnhandledRejectionIntegration(),
    ],
  });

  console.log('[Sentry] Error monitoring initialized');
}

/**
 * Sentry error handler middleware
 * Must be added AFTER all routes
 */
export function sentryErrorHandler(): ReturnType<typeof Sentry.expressErrorHandler> {
  return Sentry.expressErrorHandler();
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    // Log locally if Sentry not configured
    console.error('[Error]', error.message, context);
  }
}

/**
 * Capture a message manually
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}]`, message);
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; role?: string }): void {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(user);
  }
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(null);
  }
}

export default {
  initSentry,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  clearUser,
};
