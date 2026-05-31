import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@verifydoc.tn' },
    update: {},
    create: {
      email: 'admin@verifydoc.tn',
      passwordHash,
      name: 'Super Admin',
    },
  });
  console.log('✅ Admin created:', admin.email);
  console.log('   Password: Admin@1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
