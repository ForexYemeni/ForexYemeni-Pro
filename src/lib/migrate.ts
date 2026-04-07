import { db } from './db';
import { hashPassword } from './auth';

let migrationDone = false;

export async function ensureDatabase(): Promise<void> {
  if (migrationDone) return;

  try {
    // ═══ إنشاء جدول User إذا لم يكن موجوداً ═══
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "password" TEXT NOT NULL DEFAULT '',
        "role" TEXT NOT NULL DEFAULT 'user',
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "otp" TEXT,
        "otpExpiry" TIMESTAMP(3),
        "sessionToken" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // إضافة unique على email
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'User_email_key'
        ) THEN
          ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    // ═══ ترحيل Admin ═══
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Admin' AND column_name = 'isDefaultPassword'
        ) THEN
          ALTER TABLE "Admin" ADD COLUMN "isDefaultPassword" BOOLEAN NOT NULL DEFAULT true;
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    // ═══ التأكد من وجود حساب الأدمن الافتراضي ═══
    const existingAdmin = await db.admin.findFirst({
      where: { email: 'admin@forexyemeni.com' },
    });

    if (!existingAdmin) {
      const hashedPassword = await hashPassword('Admin@123');
      await db.admin.create({
        data: {
          email: 'admin@forexyemeni.com',
          password: hashedPassword,
          name: 'المدير',
          isDefaultPassword: true,
        },
      });
      console.log('✅ Default admin created');
    } else {
      // التأكد من أن كلمة المرور مشفرة وأن isDefaultPassword صحيح
      if (existingAdmin.password.length < 20) {
        const hashedPassword = await hashPassword(existingAdmin.password || 'Admin@123');
        await db.admin.update({
          where: { id: existingAdmin.id },
          data: { password: hashedPassword },
        });
      }
    }

    migrationDone = true;
    console.log('✅ Database migration completed');
  } catch (error) {
    console.error('⚠️ Migration error:', error);
    migrationDone = true;
  }
}
