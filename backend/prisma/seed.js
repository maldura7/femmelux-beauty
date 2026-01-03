const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.brand.deleteMany();
  console.log('✅ Existing data cleared\n');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // ============================================
  // CREATE BRANDS
  // ============================================
  console.log('🏷️  Creating brands...');

  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        name: "L'Oréal Professional",
        slug: 'loreal-professional',
        description: 'Professional hair care and styling products for salons and stylists.',
        logo: '/uploads/brands/loreal.png',
        minimumOrder: 150.00,
        status: true,
      },
    }),
    prisma.brand.create({
      data: {
        name: 'Kérastase',
        slug: 'kerastase',
        description: 'Luxury hair care brand offering premium treatments and products.',
        logo: '/uploads/brands/kerastase.png',
        minimumOrder: 200.00,
        status: true,
      },
    }),
    prisma.brand.create({
      data: {
        name: 'Olaplex',
        slug: 'olaplex',
        description: 'Revolutionary bond-building hair treatment technology.',
        logo: '/uploads/brands/olaplex.png',
        minimumOrder: 100.00,
        status: true,
      },
    }),
    prisma.brand.create({
      data: {
        name: 'Moroccanoil',
        slug: 'moroccanoil',
        description: 'Argan oil-infused hair and body products.',
        logo: '/uploads/brands/moroccanoil.png',
        minimumOrder: 125.00,
        status: true,
      },
    }),
    prisma.brand.create({
      data: {
        name: 'Redken',
        slug: 'redken',
        description: 'Professional salon hair products backed by science.',
        logo: '/uploads/brands/redken.png',
        minimumOrder: 100.00,
        status: true,
      },
    }),
    prisma.brand.create({
      data: {
        name: 'Wella Professionals',
        slug: 'wella-professionals',
        description: 'Hair color and care trusted by stylists worldwide.',
        logo: '/uploads/brands/wella.png',
        minimumOrder: 150.00,
        status: true,
      },
    }),
  ]);

  console.log(`✅ Created ${brands.length} brands\n`);

  // ============================================
  // CREATE USERS
  // ============================================
  console.log('👥 Creating users...');

  // Admin user
  await prisma.user.create({
    data: {
      email: 'admin@femmelux.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: true,
    },
  });

  // Vendor users (one per brand)
  const vendorUsers = await Promise.all(
    brands.slice(0, 3).map((brand, index) =>
      prisma.user.create({
        data: {
          email: `vendor${index + 1}@femmelux.com`,
          password: hashedPassword,
          firstName: 'Vendor',
          lastName: brand.name.split(' ')[0],
          role: 'VENDOR',
          brandId: brand.id,
          status: true,
        },
      })
    )
  );

  // Customer users
  const customerUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'salon@beautyspot.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'CUSTOMER',
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
        role: 'CUSTOMER',
        businessName: 'Glamour Hair Studio',
        taxId: 'TX-987654321',
        status: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager@stylehouse.com',
        password: hashedPassword,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        role: 'CUSTOMER',
        businessName: 'Style House',
        taxId: 'TX-456789123',
        status: true,
      },
    }),
  ]);

  console.log(`✅ Created 1 admin, ${vendorUsers.length} vendors, ${customerUsers.length} customers\n`);

  // ============================================
  // CREATE PRODUCTS
  // ============================================
  console.log('📦 Creating products...');

  const products = [];

  // L'Oréal Professional Products
  products.push(
    await prisma.product.create({
      data: {
        brandId: brands[0].id,
        name: 'Serie Expert Absolut Repair Shampoo',
        slug: 'loreal-absolut-repair-shampoo',
        description: 'Restructuring shampoo for damaged hair.',
        price: 28.00,
        wholesalePrice: 18.00,
        sku: 'LOR-ABS-SH-500',
        images: ['/uploads/products/loreal-shampoo-1.jpg'],
        quantity: 150,
        status: true,
        category: 'Shampoo',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[0].id,
        name: 'Serie Expert Absolut Repair Conditioner',
        slug: 'loreal-absolut-repair-conditioner',
        description: 'Instant resurfacing conditioner for damaged hair.',
        price: 30.00,
        wholesalePrice: 20.00,
        sku: 'LOR-ABS-CD-500',
        images: ['/uploads/products/loreal-conditioner-1.jpg'],
        quantity: 120,
        status: true,
        category: 'Conditioner',
      },
    })
  );

  // Olaplex Products
  products.push(
    await prisma.product.create({
      data: {
        brandId: brands[2].id,
        name: 'No.3 Hair Perfector',
        slug: 'olaplex-no3-hair-perfector',
        description: 'At-home treatment that reduces breakage and strengthens hair.',
        price: 30.00,
        wholesalePrice: 20.00,
        sku: 'OLA-NO3-100',
        images: ['/uploads/products/olaplex-no3-1.jpg'],
        quantity: 200,
        status: true,
        category: 'Treatment',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[2].id,
        name: 'No.4 Bond Maintenance Shampoo',
        slug: 'olaplex-no4-shampoo',
        description: 'Highly moisturizing, reparative shampoo.',
        price: 30.00,
        wholesalePrice: 20.00,
        sku: 'OLA-NO4-250',
        images: ['/uploads/products/olaplex-no4-1.jpg'],
        quantity: 180,
        status: true,
        category: 'Shampoo',
      },
    })
  );

  // Moroccanoil Products
  products.push(
    await prisma.product.create({
      data: {
        brandId: brands[3].id,
        name: 'Moroccanoil Treatment Original',
        slug: 'moroccanoil-treatment-original',
        description: 'The original foundation for hairstyling.',
        price: 48.00,
        wholesalePrice: 32.00,
        sku: 'MOR-TRT-100',
        images: ['/uploads/products/moroccanoil-treatment-1.jpg'],
        quantity: 130,
        status: true,
        category: 'Treatment',
      },
    })
  );

  console.log(`✅ Created ${products.length} products\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('='.repeat(50));
  console.log('🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • ${brands.length} Brands`);
  console.log(`   • ${1 + vendorUsers.length + customerUsers.length} Users`);
  console.log(`   • ${products.length} Products\n`);
  console.log('🔐 Test Credentials:');
  console.log('   Admin:    admin@femmelux.com / Password123!');
  console.log('   Vendor:   vendor1@femmelux.com / Password123!');
  console.log('   Customer: salon@beautyspot.com / Password123!');
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
