const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    // Find all products grouped by SKU
    const products = await prisma.product.groupBy({
      by: ['sku'],
      _count: {
        sku: true
      },
      having: {
        sku: {
          _count: {
            gt: 1
          }
        }
      },
      orderBy: {
        _count: {
          sku: 'desc'
        }
      },
      take: 20
    });
    
    console.log('Duplicate SKUs found:', products.length);
    if (products.length > 0) {
      console.log('\nTop duplicates:');
      products.forEach(p => {
        console.log(`  SKU: ${p.sku} - Count: ${p._count.sku}`);
      });
    }
    
    // Count total products for CLARALINE brand
    const claralineProducts = await prisma.product.count({
      where: {
        brand: {
          name: {
            contains: 'CLARALINE',
            mode: 'insensitive'
          }
        }
      }
    });
    console.log('\nTotal CLARALINE products:', claralineProducts);
    
    // Count unique SKUs for CLARALINE
    const uniqueSkus = await prisma.product.findMany({
      where: {
        brand: {
          name: {
            contains: 'CLARALINE',
            mode: 'insensitive'
          }
        }
      },
      select: {
        sku: true
      },
      distinct: ['sku']
    });
    console.log('Unique CLARALINE SKUs:', uniqueSkus.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();
