import { Router, Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/seed/migrate
 * @desc    Run database migrations (db push)
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
    console.log('Running database migration (db push)...');

    // Try to run prisma db push
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', {
      cwd: process.cwd(),
      env: process.env,
    });

    console.log('Migration stdout:', stdout);
    if (stderr) console.log('Migration stderr:', stderr);

    res.json({
      success: true,
      message: 'Database migration completed',
      output: stdout,
      errors: stderr || null,
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
