import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  const results: Record<string, string> = {};

  try {
    // ════════════════════════════════════════════
    // 1. إنشاء جدول User إذا غير موجود
    // ════════════════════════════════════════════
    try {
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
      results.create_user_table = 'ok';
    } catch (e: any) {
      results.create_user_table_error = e.message;
    }

    // unique email
    try {
      await db.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_email_key') THEN
            ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
          END IF;
        EXCEPTION WHEN OTHERS THEN NULL;
        END $$;
      `);
      results.user_email_unique = 'ok';
    } catch (e: any) {
      results.user_email_unique = 'ok';
    }

    // ════════════════════════════════════════════
    // 2. إعادة تعيين كلمة مرور المدير
    // ════════════════════════════════════════════
    try {
      // حذف المدير القديم الخاطئ
      await db.$executeRawUnsafe(`DELETE FROM "Admin" WHERE "email" = 'admin'`);
      results.old_admin_removed = 'ok';

      // تشفير كلمة المرور الافتراضية
      const hashed = await hashPassword('Admin@123');

      // تحديث أو إنشاء المدير الصحيح
      await db.$executeRawUnsafe(`
        INSERT INTO "Admin" ("id", "email", "password", "name", "isDefaultPassword", "createdAt", "updatedAt")
        VALUES (
          (SELECT COALESCE((SELECT "id" FROM "Admin" WHERE "email" = 'admin@forexyemeni.com'), gen_random_uuid())),
          'admin@forexyemeni.com',
          '${hashed}',
          'المدير',
          true,
          COALESCE((SELECT "createdAt" FROM "Admin" WHERE "email" = 'admin@forexyemeni.com'), NOW()),
          NOW()
        )
        ON CONFLICT ("email") DO UPDATE SET
          "password" = EXCLUDED."password",
          "isDefaultPassword" = true,
          "name" = 'المدير'
      `);
      results.admin_password_reset = 'ok - password hashed and set to Admin@123';
    } catch (e: any) {
      // إذا ON CONFLICT لا يعمل بسبب عدم وجود constraint
      try {
        const hashed = await hashPassword('Admin@123');
        await db.$executeRawUnsafe(`
          UPDATE "Admin" SET "password" = '${hashed}', "isDefaultPassword" = true, "email" = 'admin@forexyemeni.com', "name" = 'المدير'
          WHERE "email" = 'admin@forexyemeni.com' OR "email" = 'admin'
        `);
        results.admin_password_reset = 'ok - updated via fallback';
      } catch (e2: any) {
        results.admin_password_error = e2.message;
      }
    }

    // ════════════════════════════════════════════
    // 3. فحص نهائي
    // ════════════════════════════════════════════
    try {
      const admins = await db.$queryRawUnsafe(
        `SELECT id, email, name, "isDefaultPassword" FROM "Admin"`
      ) as any[];
      results.final_admins = JSON.stringify(admins);
    } catch (e: any) {
      results.final_admins_error = e.message;
    }

    try {
      const userCols = await db.$queryRawUnsafe(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'User'
      `);
      results.user_table_columns = JSON.stringify(userCols);
    } catch (e: any) {
      results.user_table_error = e.message;
    }

    results.status = '✅ تم الإصلاح بنجاح';
    results.admin_login = 'admin@forexyemeni.com / Admin@123';

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({
      status: '❌ خطأ',
      fatal_error: error.message,
      results,
    }, { status: 500 });
  }
}
