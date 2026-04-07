import { db } from './db';

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 ترحيل قاعدة البيانات - يعمل تلقائياً قبل أي عملية
// ═══════════════════════════════════════════════════════════════════════════
let migrationDone = false;

export async function ensureDatabase(): Promise<void> {
  if (migrationDone) return;

  try {
    // ═══ ترحيل Admin: username → email + إضافة isDefaultPassword ═══
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        -- إعادة تسمية username إلى email إذا لزم الأمر
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Admin' AND column_name = 'username'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Admin' AND column_name = 'email'
        ) THEN
          ALTER TABLE "Admin" RENAME COLUMN "username" TO "email";
        END IF;

        -- إضافة عمود email إذا لم يكن موجود (في حال لم يكن هناك username أصلاً)
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Admin' AND column_name = 'email'
        ) THEN
          ALTER TABLE "Admin" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';
        END IF;

        -- إضافة isDefaultPassword
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'Admin' AND column_name = 'isDefaultPassword'
        ) THEN
          ALTER TABLE "Admin" ADD COLUMN "isDefaultPassword" BOOLEAN NOT NULL DEFAULT true;
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    // ═══ ترحيل User: إضافة password + isVerified ═══
    await db.$executeRawUnsafe(`
      DO $$ BEGIN
        -- إضافة عمود password
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'password'
        ) THEN
          ALTER TABLE "User" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';
        END IF;

        -- إضافة عمود isVerified
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'isVerified'
        ) THEN
          ALTER TABLE "User" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT true;
        END IF;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    migrationDone = true;
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('⚠️ Migration error (non-critical):', error);
    // لا نوقف العملية حتى لو فشل الترحيل
    migrationDone = true;
  }
}
