import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import hpp from 'hpp';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware';
import {
  generalLimiter,
  sanitizeBody,
  sanitizeQuery,
  preventSqlInjection,
  customSecurityHeaders,
} from './middleware/security.middleware';

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();

// ============================================
// SECURITY MIDDLEWARE (Applied first)
// ============================================

// Helmet - sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for images
}));

// Custom security headers
app.use(customSecurityHeaders);

// HPP - prevent HTTP Parameter Pollution
app.use(hpp());

// General rate limiting - applies to all routes
app.use(generalLimiter);

// ============================================
// CORS & PARSING MIDDLEWARE
// ============================================

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// INPUT SANITIZATION MIDDLEWARE
// ============================================

// Sanitize request body and query parameters
app.use(sanitizeBody);
app.use(sanitizeQuery);

// Prevent SQL injection attempts
app.use(preventSqlInjection);

// ============================================
// LOGGING MIDDLEWARE
// ============================================

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// STATIC FILES (Uploads)
// ============================================

// Serve static files from uploads directory with proper 404 handling
const uploadsPath = path.join(__dirname, '..', 'uploads');
app.use('/uploads', (req: Request, res: Response, next) => {
  const filePath = path.join(uploadsPath, req.path);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File doesn't exist - return 404 with no body (not HTML)
      res.status(404).end();
    } else {
      next();
    }
  });
}, express.static(uploadsPath, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
}));

// ============================================
// ROUTES
// ============================================

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'FemmeLux Beauty API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health',
  });
});

// API Routes
app.use('/api', routes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Optional: Connect to Redis
    // await connectRedis();

    // Start listening
    const server = app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌸 FemmeLux Beauty API Server                           ║
║                                                           ║
║   Environment: ${config.nodeEnv.padEnd(42)}║
║   Port: ${config.port.toString().padEnd(49)}║
║   URL: http://localhost:${config.port.toString().padEnd(33)}║
║                                                           ║
║   API Endpoints:                                          ║
║   • Auth:         /api/auth                               ║
║   • Applications: /api/applications                       ║
║   • Brands:       /api/brands                             ║
║   • Products:     /api/products                           ║
║   • Orders:       /api/orders                             ║
║   • Health:       /api/health                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('HTTP server closed.');

        try {
          await disconnectDatabase();
          console.log('Database disconnected.');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ============================================
// GLOBAL ERROR HANDLERS
// ============================================

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
