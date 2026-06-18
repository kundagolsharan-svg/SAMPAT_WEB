const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.transaction.count();
  console.log(`Total transactions: ${count}`);
  const users = await prisma.user.count();
  console.log(`Total users: ${users}`);
  const accounts = await prisma.account.count();
  console.log(`Total accounts: ${accounts}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
