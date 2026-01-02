import { Router, Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/seed/migrate
 * @desc    Run database migrations using raw SQL
 * @access  Public (protected by secret key)
 */
router.post('/migrate', async (req: Request, res: Response): Promise<void> => {
  const seedKey = req.headers['x-seed-key'] || req.query.key;

  if (seedKey !== 'femmelux-seed-2024-init') {
    res.status(403).json({
      success: false,
      message: 'Invalid seed key',
    });
    return;
  }

  try {
    console.log('Running database migration using raw SQL...');

    // Check if tables already exist
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    ` as Array<{ exists: boolean }>;

    if (tableCheck[0]?.exists) {
      res.json({
        success: true,
        message: 'Database tables already exist',
        migrated: false,
      });
      return;
    }

    // Run migration SQL in order - ENUMs first, then tables, then indexes
    const migrationStatements = [
      // Create ENUMs
      `DO $$ BEGIN CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VENDOR', 'CUSTOMER'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE "AccountStatus" AS ENUM ('GUEST', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE "ApplicationType" AS ENUM ('CUSTOMER', 'VENDOR'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE "MessageStatus" AS ENUM ('UNREAD', 'READ', 'REPLIED', 'ARCHIVED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN CREATE TYPE "MessagePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,

      // Create tables
      `CREATE TABLE IF NOT EXISTS "brands" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "logo" TEXT,
        "description" TEXT,
        "minimumOrder" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "status" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
      );`,

      `CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
        "brandId" TEXT,
        "accountStatus" "AccountStatus" NOT NULL DEFAULT 'GUEST',
        "appliedAt" TIMESTAMP(3),
        "approvedAt" TIMESTAMP(3),
        "approvedBy" TEXT,
        "rejectedAt" TIMESTAMP(3),
        "rejectedBy" TEXT,
        "rejectionReason" TEXT,
        "suspendedAt" TIMESTAMP(3),
        "suspensionReason" TEXT,
        "businessName" TEXT,
        "businessType" TEXT,
        "taxId" TEXT,
        "phone" TEXT,
        "businessAddress" JSONB,
        "businessWebsite" TEXT,
        "businessYears" INTEGER,
        "businessLicense" TEXT,
        "resaleCertificate" TEXT,
        "estimatedMonthlyPurchase" DECIMAL(10,2),
        "howDidYouHear" TEXT,
        "references" TEXT,
        "additionalNotes" TEXT,
        "status" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );`,

      `CREATE TABLE IF NOT EXISTS "business_applications" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "applicationType" "ApplicationType" NOT NULL,
        "businessName" TEXT NOT NULL,
        "businessType" TEXT NOT NULL,
        "taxId" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "businessAddress" JSONB NOT NULL,
        "businessWebsite" TEXT,
        "businessYears" INTEGER,
        "businessLicense" TEXT,
        "resaleCertificate" TEXT,
        "estimatedMonthlyPurchase" DECIMAL(10,2),
        "howDidYouHear" TEXT,
        "references" TEXT,
        "additionalNotes" TEXT,
        "brandName" TEXT,
        "brandDescription" TEXT,
        "productCategories" TEXT[],
        "vendorMinimumOrder" DECIMAL(10,2),
        "productLineSize" INTEGER,
        "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
        "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "reviewedAt" TIMESTAMP(3),
        "reviewedBy" TEXT,
        "reviewNotes" TEXT,
        "rejectionReason" TEXT,
        "documents" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "business_applications_pkey" PRIMARY KEY ("id")
      );`,

      `CREATE TABLE IF NOT EXISTS "products" (
        "id" TEXT NOT NULL,
        "brandId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "costPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "wholesalePrice" DECIMAL(10,2) NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "sku" TEXT NOT NULL,
        "images" TEXT[],
        "quantity" INTEGER NOT NULL DEFAULT 0,
        "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
        "status" BOOLEAN NOT NULL DEFAULT true,
        "category" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "searchVector" TEXT,
        "popularity" INTEGER NOT NULL DEFAULT 0,
        "viewCount" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "products_pkey" PRIMARY KEY ("id")
      );`,

      `CREATE TABLE IF NOT EXISTS "orders" (
        "id" TEXT NOT NULL,
        "orderNumber" TEXT NOT NULL,
        "customerId" TEXT NOT NULL,
        "subtotal" DECIMAL(10,2) NOT NULL,
        "tax" DECIMAL(10,2) NOT NULL,
        "shipping" DECIMAL(10,2) NOT NULL,
        "total" DECIMAL(10,2) NOT NULL,
        "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
        "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
        "shippingAddress" JSONB NOT NULL,
        "billingAddress" JSONB NOT NULL,
        "notes" TEXT,
        "trackingNumber" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
      );`,

      `CREATE TABLE IF NOT EXISTS "order_items" (
        "id" TEXT NOT NULL,
        "orderId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "subtotal" DECIMAL(10,2) NOT NULL,
        CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
      );`,

      `CREATE TABLE IF NOT EXISTS "search_logs" (
        "id" TEXT NOT NULL,
        "query" TEXT NOT NULL,
        "userId" TEXT,
        "resultsCount" INTEGER NOT NULL DEFAULT 0,
        "clickedProductId" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
      );`,

      `CREATE TABLE IF NOT EXISTS "categories" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "description" TEXT,
        "image" TEXT,
        "parentId" TEXT,
        "status" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
      );`,

      `CREATE TABLE IF NOT EXISTS "contact_messages" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "subject" TEXT NOT NULL,
        "orderNumber" TEXT,
        "message" TEXT NOT NULL,
        "status" "MessageStatus" NOT NULL DEFAULT 'UNREAD',
        "priority" "MessagePriority" NOT NULL DEFAULT 'NORMAL',
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
      );`,

      `CREATE TABLE IF NOT EXISTS "message_replies" (
        "id" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "sentBy" TEXT NOT NULL,
        "sentByName" TEXT NOT NULL,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "message_replies_pkey" PRIMARY KEY ("id")
      );`,

      `CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "usedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
      );`,

      // Create unique constraints and indexes
      `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "brands_slug_key" ON "brands"("slug");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_key" ON "products"("slug");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "products_sku_key" ON "products"("sku");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON "orders"("orderNumber");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_key" ON "categories"("slug");`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens"("token");`,

      // Add foreign keys
      `DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "business_applications" ADD CONSTRAINT "business_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "business_applications" ADD CONSTRAINT "business_applications_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_clickedProductId_fkey" FOREIGN KEY ("clickedProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "message_replies" ADD CONSTRAINT "message_replies_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "contact_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
      `DO $$ BEGIN ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
    ];

    let successCount = 0;
    const errors: string[] = [];

    for (const sql of migrationStatements) {
      try {
        await prisma.$executeRawUnsafe(sql);
        successCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        // Skip duplicate errors as they mean object already exists
        if (!errorMsg.includes('already exists') && !errorMsg.includes('duplicate')) {
          errors.push(errorMsg);
        }
      }
    }

    console.log(`Migration completed: ${successCount}/${migrationStatements.length} statements executed`);
    if (errors.length > 0) {
      console.log('Migration errors:', errors);
    }

    res.json({
      success: true,
      message: 'Database migration completed',
      stats: {
        total: migrationStatements.length,
        successful: successCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run migration',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   POST /api/seed
 * @desc    Seed the database with initial data (one-time use)
 * @access  Public (protected by secret key)
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  // Simple protection - require a secret key
  const seedKey = req.headers['x-seed-key'] || req.query.key;

  if (seedKey !== 'femmelux-seed-2024-init') {
    res.status(403).json({
      success: false,
      message: 'Invalid seed key',
    });
    return;
  }

  try {
    // Check if already seeded
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN },
    });

    if (existingAdmin) {
      res.status(400).json({
        success: false,
        message: 'Database already seeded. Admin user exists.',
      });
      return;
    }

    console.log('Starting database seeding...');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // Create brands
    const brands = await Promise.all([
      prisma.brand.create({
        data: {
          name: "L'Oréal Professional",
          slug: 'loreal-professional',
          description: 'Professional hair care and styling products for salons and stylists.',
          logo: '/uploads/brands/loreal.png',
          minimumOrder: 150.0,
          status: true,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'Kérastase',
          slug: 'kerastase',
          description: 'Luxury hair care brand offering premium treatments and products.',
          logo: '/uploads/brands/kerastase.png',
          minimumOrder: 200.0,
          status: true,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'Olaplex',
          slug: 'olaplex',
          description: 'Revolutionary bond-building hair treatment technology.',
          logo: '/uploads/brands/olaplex.png',
          minimumOrder: 100.0,
          status: true,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'Moroccanoil',
          slug: 'moroccanoil',
          description: 'Argan oil-infused hair and body products.',
          logo: '/uploads/brands/moroccanoil.png',
          minimumOrder: 125.0,
          status: true,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'Redken',
          slug: 'redken',
          description: 'Professional salon hair products backed by science.',
          logo: '/uploads/brands/redken.png',
          minimumOrder: 100.0,
          status: true,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'Wella Professionals',
          slug: 'wella-professionals',
          description: 'Hair color and care trusted by stylists worldwide.',
          logo: '/uploads/brands/wella.png',
          minimumOrder: 150.0,
          status: true,
        },
      }),
    ]);

    // Create admin user
    await prisma.user.create({
      data: {
        email: 'admin@femmelux.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        status: true,
      },
    });

    // Create vendor users
    await Promise.all(
      brands.slice(0, 3).map((brand, index) =>
        prisma.user.create({
          data: {
            email: `vendor${index + 1}@femmelux.com`,
            password: hashedPassword,
            firstName: 'Vendor',
            lastName: brand.name.split(' ')[0],
            role: UserRole.VENDOR,
            brandId: brand.id,
            status: true,
          },
        })
      )
    );

    // Create customer users
    await Promise.all([
      prisma.user.create({
        data: {
          email: 'salon@beautyspot.com',
          password: hashedPassword,
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: UserRole.CUSTOMER,
          businessName: 'Beauty Spot Salon',
          taxId: 'TX-123456789',
          status: true,
        },
      }),
      prisma.user.create({
        data: {
          email: 'owner@glamourhair.com',
          password: hashedPassword,
          firstName: 'Michael',
          lastName: 'Chen',
          role: UserRole.CUSTOMER,
          businessName: 'Glamour Hair Studio',
          taxId: 'TX-987654321',
          status: true,
        },
      }),
    ]);

    // Create sample products
    const products = await Promise.all([
      // L'Oréal Products
      prisma.product.create({
        data: {
          brandId: brands[0].id,
          name: 'Serie Expert Absolut Repair Shampoo',
          slug: 'loreal-absolut-repair-shampoo',
          description: 'Restructuring shampoo for damaged hair.',
          price: 28.0,
          wholesalePrice: 18.0,
          sku: 'LOR-ABS-SH-500',
          images: ['/uploads/products/loreal-shampoo-1.jpg'],
          quantity: 150,
          status: true,
          category: 'Shampoo',
        },
      }),
      prisma.product.create({
        data: {
          brandId: brands[0].id,
          name: 'Mythic Oil Original',
          slug: 'loreal-mythic-oil-original',
          description: 'Nourishing oil for all hair types.',
          price: 45.0,
          wholesalePrice: 30.0,
          sku: 'LOR-MYT-OIL-100',
          images: ['/uploads/products/loreal-oil-1.jpg'],
          quantity: 80,
          status: true,
          category: 'Treatment',
        },
      }),
      // Olaplex Products
      prisma.product.create({
        data: {
          brandId: brands[2].id,
          name: 'No.3 Hair Perfector',
          slug: 'olaplex-no3-hair-perfector',
          description: 'At-home treatment that reduces breakage.',
          price: 30.0,
          wholesalePrice: 20.0,
          sku: 'OLA-NO3-100',
          images: ['/uploads/products/olaplex-no3-1.jpg'],
          quantity: 200,
          status: true,
          category: 'Treatment',
        },
      }),
      prisma.product.create({
        data: {
          brandId: brands[2].id,
          name: 'No.4 Bond Maintenance Shampoo',
          slug: 'olaplex-no4-shampoo',
          description: 'Highly moisturizing, reparative shampoo.',
          price: 30.0,
          wholesalePrice: 20.0,
          sku: 'OLA-NO4-250',
          images: ['/uploads/products/olaplex-no4-1.jpg'],
          quantity: 180,
          status: true,
          category: 'Shampoo',
        },
      }),
      // Moroccanoil Products
      prisma.product.create({
        data: {
          brandId: brands[3].id,
          name: 'Moroccanoil Treatment Original',
          slug: 'moroccanoil-treatment-original',
          description: 'The original foundation for hairstyling.',
          price: 48.0,
          wholesalePrice: 32.0,
          sku: 'MOR-TRT-100',
          images: ['/uploads/products/moroccanoil-treatment-1.jpg'],
          quantity: 130,
          status: true,
          category: 'Treatment',
        },
      }),
    ]);

    console.log('Database seeding completed!');

    res.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        brands: brands.length,
        users: 6,
        products: products.length,
      },
      credentials: {
        admin: {
          email: 'admin@femmelux.com',
          password: 'Password123!',
        },
        vendor: {
          email: 'vendor1@femmelux.com',
          password: 'Password123!',
        },
        customer: {
          email: 'salon@beautyspot.com',
          password: 'Password123!',
        },
      },
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
