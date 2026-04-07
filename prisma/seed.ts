import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

async function seedAdmin() {
  const existingAdmin = await db.user.findUnique({
    where: { email: 'admin@forexyemeni.com' },
  });

  if (!existingAdmin) {
    const hashedPassword = hashPassword('Admin@123456');
    await db.user.create({
      data: {
        email: 'admin@forexyemeni.com',
        name: 'المدير',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        plan: 'VIP',
      },
    });
    console.log('Admin user created: admin@forexyemeni.com / Admin@123456');
  } else {
    console.log('Admin user already exists');
  }
}

seedAdmin()
  .catch(console.error)
  .finally(() => db.$disconnect());
