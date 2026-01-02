const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    // Find CLARALINE brand
    const brand = await prisma.brand.findFirst({
      where: {
        name: {
          contains: 'CLARALINE',
          mode: 'insensitive'
        }
      }
    });

    if (!brand) {
      console.log('CLARALINE brand not found');
      return;
    }

    console.log('Found CLARALINE brand:', brand.id);

    // Count products
    const productCount = await prisma.product.count({
      where: { brandId: brand.id }
    });
    console.log('Products to delete:', productCount);

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Delete order items for these products
      const orderItemsDeleted = await tx.orderItem.deleteMany({
        where: {
          product: {
            brandId: brand.id
          }
        }
      });
      console.log('Order items deleted:', orderItemsDeleted.count);

      // Delete products
      const productsDeleted = await tx.product.deleteMany({
        where: { brandId: brand.id }
      });
      console.log('Products deleted:', productsDeleted.count);

      // Delete brand
      await tx.brand.delete({
        where: { id: brand.id }
      });
      console.log('Brand deleted');
    });

    console.log('\nCleanup complete! You can now re-import CLARALINE.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
