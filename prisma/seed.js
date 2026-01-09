const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.instance.deleteMany();
  await prisma.client.deleteMany();
  await prisma.admin.deleteMany();

  // Create default admin
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  const admin = await prisma.admin.create({
    data: {
      email: process.env.ADMIN_EMAIL || 'admin@xpmaestrocloud.com',
      passwordHash: adminPassword,
    },
  });

  console.log('✅ Database seeded successfully');
  console.log(`📧 Admin email: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
