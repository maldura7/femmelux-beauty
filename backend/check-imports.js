const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkImports() {
  try {
    const products = await prisma.product.findMany({
      where: {
        brand: { name: { contains: 'CLARALINE', mode: 'insensitive' } }
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const dateGroups = {};
    products.forEach(p => {
      const key = p.createdAt.toISOString().substring(0, 16);
      dateGroups[key] = (dateGroups[key] || 0) + 1;
    });

    console.log('Products grouped by import time:');
    Object.entries(dateGroups).forEach(([date, count]) => {
      console.log('  ' + date + ': ' + count + ' products');
    });
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkImports();
