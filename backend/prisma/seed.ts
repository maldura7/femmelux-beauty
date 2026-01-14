import { PrismaClient, UserRole, OrderStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // SAFETY CHECK: Don't delete data if products already exist
  // This prevents accidental data loss on production
  const existingProducts = await prisma.product.count();
  const existingBrands = await prisma.brand.count();

  if (existingProducts > 20 || existingBrands > 10) {
    console.log('⚠️  DATABASE ALREADY HAS DATA!');
    console.log(`   Found ${existingProducts} products and ${existingBrands} brands`);
    console.log('   Skipping seed to prevent data loss.');
    console.log('   To force seed, delete data manually first or set FORCE_SEED=true');

    if (process.env.FORCE_SEED !== 'true') {
      console.log('\n✅ Seed skipped - existing data preserved');
      return;
    }
    console.log('\n⚠️  FORCE_SEED=true detected, proceeding with data deletion...');
  }

  // Clear existing data (only runs if database is empty or FORCE_SEED=true)
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
        name: 'L\'Oréal Professional',
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
      role: UserRole.ADMIN,
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
          firstName: `Vendor`,
          lastName: `${brand.name.split(' ')[0]}`,
          role: UserRole.VENDOR,
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
    prisma.user.create({
      data: {
        email: 'manager@stylehouse.com',
        password: hashedPassword,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        role: UserRole.CUSTOMER,
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

  const products: any[] = [];

  // L'Oréal Professional Products
  products.push(
    await prisma.product.create({
      data: {
        brandId: brands[0].id,
        name: 'Serie Expert Absolut Repair Shampoo',
        slug: 'loreal-absolut-repair-shampoo',
        description: 'Restructuring shampoo for damaged hair. Deeply cleanses while restoring hair fiber.',
        price: 28.00,
        wholesalePrice: 18.00,
        sku: 'LOR-ABS-SH-500',
        images: ['/uploads/products/loreal-shampoo-1.jpg', '/uploads/products/loreal-shampoo-2.jpg'],
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
        description: 'Instant resurfacing conditioner for damaged hair. Provides instant detangling.',
        price: 30.00,
        wholesalePrice: 20.00,
        sku: 'LOR-ABS-CD-500',
        images: ['/uploads/products/loreal-conditioner-1.jpg'],
        quantity: 120,
        status: true,
        category: 'Conditioner',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[0].id,
        name: 'Mythic Oil Original',
        slug: 'loreal-mythic-oil-original',
        description: 'Nourishing oil for all hair types. Provides brilliant shine and softness.',
        price: 45.00,
        wholesalePrice: 30.00,
        sku: 'LOR-MYT-OIL-100',
        images: ['/uploads/products/loreal-oil-1.jpg'],
        quantity: 80,
        status: true,
        category: 'Treatment',
      },
    })
  );

  // Kérastase Products
  products.push(
    await prisma.product.create({
      data: {
        brandId: brands[1].id,
        name: 'Bain Satin 1 Shampoo',
        slug: 'kerastase-bain-satin-1',
        description: 'Nutrition shampoo for normal to slightly dry hair. Provides essential nourishment.',
        price: 38.00,
        wholesalePrice: 25.00,
        sku: 'KER-SAT-SH-250',
        images: ['/uploads/products/kerastase-shampoo-1.jpg'],
        quantity: 100,
        status: true,
        category: 'Shampoo',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[1].id,
        name: 'Elixir Ultime Oil',
        slug: 'kerastase-elixir-ultime',
        description: 'Beautifying oil for all hair types. L\'Huile Originale for brilliant shine.',
        price: 55.00,
        wholesalePrice: 38.00,
        sku: 'KER-ELX-OIL-100',
        images: ['/uploads/products/kerastase-oil-1.jpg'],
        quantity: 60,
        status: true,
        category: 'Treatment',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[1].id,
        name: 'Resistance Masque Force Architecte',
        slug: 'kerastase-force-architecte',
        description: 'Reconstructing masque for damaged hair. Reinforces hair fiber architecture.',
        price: 65.00,
        wholesalePrice: 45.00,
        sku: 'KER-RES-MSK-200',
        images: ['/uploads/products/kerastase-mask-1.jpg'],
        quantity: 45,
        status: true,
        category: 'Mask',
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
        description: 'Highly moisturizing, reparative shampoo that leaves hair easy to manage.',
        price: 30.00,
        wholesalePrice: 20.00,
        sku: 'OLA-NO4-250',
        images: ['/uploads/products/olaplex-no4-1.jpg'],
        quantity: 180,
        status: true,
        category: 'Shampoo',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[2].id,
        name: 'No.5 Bond Maintenance Conditioner',
        slug: 'olaplex-no5-conditioner',
        description: 'Highly moisturizing, reparative conditioner for all hair types.',
        price: 30.00,
        wholesalePrice: 20.00,
        sku: 'OLA-NO5-250',
        images: ['/uploads/products/olaplex-no5-1.jpg'],
        quantity: 175,
        status: true,
        category: 'Conditioner',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[2].id,
        name: 'No.7 Bonding Oil',
        slug: 'olaplex-no7-bonding-oil',
        description: 'Weightless reparative styling oil that dramatically increases shine.',
        price: 30.00,
        wholesalePrice: 20.00,
        sku: 'OLA-NO7-30',
        images: ['/uploads/products/olaplex-no7-1.jpg'],
        quantity: 90,
        status: true,
        category: 'Treatment',
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
        description: 'The original foundation for hairstyling. Conditions, detangles and speeds up drying time.',
        price: 48.00,
        wholesalePrice: 32.00,
        sku: 'MOR-TRT-100',
        images: ['/uploads/products/moroccanoil-treatment-1.jpg'],
        quantity: 130,
        status: true,
        category: 'Treatment',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[3].id,
        name: 'Hydrating Shampoo',
        slug: 'moroccanoil-hydrating-shampoo',
        description: 'Gentle, sulfate-free formula infused with antioxidant-rich argan oil.',
        price: 26.00,
        wholesalePrice: 17.00,
        sku: 'MOR-HYD-SH-250',
        images: ['/uploads/products/moroccanoil-shampoo-1.jpg'],
        quantity: 110,
        status: true,
        category: 'Shampoo',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[3].id,
        name: 'Intense Hydrating Mask',
        slug: 'moroccanoil-intense-hydrating-mask',
        description: 'High-performance mask for medium to thick dry hair.',
        price: 42.00,
        wholesalePrice: 28.00,
        sku: 'MOR-INT-MSK-250',
        images: ['/uploads/products/moroccanoil-mask-1.jpg'],
        quantity: 75,
        status: true,
        category: 'Mask',
      },
    })
  );

  // Redken Products
  products.push(
    await prisma.product.create({
      data: {
        brandId: brands[4].id,
        name: 'All Soft Shampoo',
        slug: 'redken-all-soft-shampoo',
        description: 'Softening shampoo for dry, brittle hair. Provides intense softness.',
        price: 24.00,
        wholesalePrice: 16.00,
        sku: 'RED-ALS-SH-300',
        images: ['/uploads/products/redken-shampoo-1.jpg'],
        quantity: 140,
        status: true,
        category: 'Shampoo',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[4].id,
        name: 'Extreme Strengthening Conditioner',
        slug: 'redken-extreme-conditioner',
        description: 'Strengthening conditioner for damaged hair. Fortifies weakened hair.',
        price: 26.00,
        wholesalePrice: 17.00,
        sku: 'RED-EXT-CD-300',
        images: ['/uploads/products/redken-conditioner-1.jpg'],
        quantity: 125,
        status: true,
        category: 'Conditioner',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[4].id,
        name: 'One United Multi-Benefit Treatment',
        slug: 'redken-one-united',
        description: '25 benefits in one bottle. Multi-benefit treatment spray for all hair types.',
        price: 30.00,
        wholesalePrice: 20.00,
        sku: 'RED-ONE-150',
        images: ['/uploads/products/redken-oneunited-1.jpg'],
        quantity: 95,
        status: true,
        category: 'Treatment',
      },
    })
  );

  // Wella Products
  products.push(
    await prisma.product.create({
      data: {
        brandId: brands[5].id,
        name: 'Fusion Intense Repair Shampoo',
        slug: 'wella-fusion-shampoo',
        description: 'Intense repair shampoo for damaged hair. Gently cleanses and repairs.',
        price: 22.00,
        wholesalePrice: 14.00,
        sku: 'WEL-FUS-SH-250',
        images: ['/uploads/products/wella-shampoo-1.jpg'],
        quantity: 160,
        status: true,
        category: 'Shampoo',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[5].id,
        name: 'Oil Reflections Luminous Smoothening Oil',
        slug: 'wella-oil-reflections',
        description: 'Lightweight smoothening oil that provides brilliant luminosity.',
        price: 35.00,
        wholesalePrice: 23.00,
        sku: 'WEL-OIL-100',
        images: ['/uploads/products/wella-oil-1.jpg'],
        quantity: 70,
        status: true,
        category: 'Treatment',
      },
    }),
    await prisma.product.create({
      data: {
        brandId: brands[5].id,
        name: 'EIMI Thermal Image Heat Protection',
        slug: 'wella-eimi-thermal-image',
        description: 'Dual-action heat protection spray for styling with thermal tools.',
        price: 20.00,
        wholesalePrice: 13.00,
        sku: 'WEL-EMI-TH-150',
        images: ['/uploads/products/wella-thermal-1.jpg'],
        quantity: 85,
        status: true,
        category: 'Styling',
      },
    })
  );

  console.log(`✅ Created ${products.length} products\n`);

  // ============================================
  // CREATE SAMPLE ORDERS
  // ============================================
  console.log('🛒 Creating sample orders...');

  const sampleAddress = {
    firstName: 'Sarah',
    lastName: 'Johnson',
    company: 'Beauty Spot Salon',
    address: '123 Main Street',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90001',
    country: 'USA',
    phone: '+1 (555) 123-4567',
  };

  // Order 1 - Delivered
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'FL-2024-0001',
      customerId: customerUsers[0].id,
      subtotal: 156.00,
      tax: 12.48,
      shipping: 15.00,
      total: 183.48,
      status: OrderStatus.DELIVERED,
      paymentStatus: PaymentStatus.PAID,
      shippingAddress: sampleAddress,
      billingAddress: sampleAddress,
      trackingNumber: '1Z999AA10123456784',
      notes: 'First wholesale order',
      createdAt: new Date('2024-12-01'),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: order1.id, productId: products[0].id, quantity: 3, price: 18.00, subtotal: 54.00 },
      { orderId: order1.id, productId: products[1].id, quantity: 2, price: 20.00, subtotal: 40.00 },
      { orderId: order1.id, productId: products[6].id, quantity: 3, price: 20.00, subtotal: 60.00 },
    ],
  });

  // Order 2 - Shipped
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'FL-2024-0002',
      customerId: customerUsers[0].id,
      subtotal: 245.00,
      tax: 19.60,
      shipping: 15.00,
      total: 279.60,
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.PAID,
      shippingAddress: sampleAddress,
      billingAddress: sampleAddress,
      trackingNumber: '1Z999AA10123456785',
      createdAt: new Date('2024-12-15'),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: order2.id, productId: products[3].id, quantity: 4, price: 25.00, subtotal: 100.00 },
      { orderId: order2.id, productId: products[4].id, quantity: 2, price: 38.00, subtotal: 76.00 },
      { orderId: order2.id, productId: products[10].id, quantity: 3, price: 32.00, subtotal: 96.00 },
    ],
  });

  // Order 3 - Processing
  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'FL-2024-0003',
      customerId: customerUsers[1].id,
      subtotal: 180.00,
      tax: 14.40,
      shipping: 15.00,
      total: 209.40,
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.PAID,
      shippingAddress: {
        ...sampleAddress,
        firstName: 'Michael',
        lastName: 'Chen',
        company: 'Glamour Hair Studio',
        address: '456 Fashion Ave',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
      billingAddress: {
        ...sampleAddress,
        firstName: 'Michael',
        lastName: 'Chen',
        company: 'Glamour Hair Studio',
        address: '456 Fashion Ave',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
      createdAt: new Date('2024-12-20'),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: order3.id, productId: products[7].id, quantity: 5, price: 20.00, subtotal: 100.00 },
      { orderId: order3.id, productId: products[8].id, quantity: 4, price: 20.00, subtotal: 80.00 },
    ],
  });

  // Order 4 - Pending
  const order4 = await prisma.order.create({
    data: {
      orderNumber: 'FL-2024-0004',
      customerId: customerUsers[2].id,
      subtotal: 320.00,
      tax: 25.60,
      shipping: 0.00,
      total: 345.60,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      shippingAddress: {
        ...sampleAddress,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        company: 'Style House',
        address: '789 Trend Blvd',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
      },
      billingAddress: {
        ...sampleAddress,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        company: 'Style House',
        address: '789 Trend Blvd',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
      },
      notes: 'Please include samples if available',
      createdAt: new Date('2024-12-28'),
    },
  });

  await prisma.orderItem.createMany({
    data: [
      { orderId: order4.id, productId: products[2].id, quantity: 4, price: 30.00, subtotal: 120.00 },
      { orderId: order4.id, productId: products[5].id, quantity: 2, price: 45.00, subtotal: 90.00 },
      { orderId: order4.id, productId: products[12].id, quantity: 5, price: 28.00, subtotal: 140.00 },
    ],
  });

  console.log('✅ Created 4 sample orders\n');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('=' .repeat(50));
  console.log('🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • ${brands.length} Brands`);
  console.log(`   • ${1 + vendorUsers.length + customerUsers.length} Users (1 admin, ${vendorUsers.length} vendors, ${customerUsers.length} customers)`);
  console.log(`   • ${products.length} Products`);
  console.log('   • 4 Orders\n');
  console.log('🔐 Test Credentials:');
  console.log('   Admin:    admin@femmelux.com / Password123!');
  console.log('   Vendor:   vendor1@femmelux.com / Password123!');
  console.log('   Customer: salon@beautyspot.com / Password123!');
  console.log('=' .repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
