import { db } from './db';

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

    migrationDone = true;
    console.log('✅ Database migration completed');
  } catch (error) {
    console.error('⚠️ Migration error:', error);
    migrationDone = true;
  }
}
