const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      accountStatus: true,
      firstName: true,
      lastName: true,
      status: true,
    },
  });

  console.log('Users in database:');
  users.forEach(user => {
    console.log(`- ${user.email} | Role: ${user.role} | Status: ${user.accountStatus} | Active: ${user.status}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
