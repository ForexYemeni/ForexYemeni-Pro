import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  const results: Record<string, string> = {};

  try {
    // ══════════════════════════════════════════════════════════
    // 1. إنشاء جدول User إذا لم يكن موجوداً
    // ══════════════════════════════════════════════════════════
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

    // إضافة unique constraint على email
    try {
      await db.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'User_email_key'
          ) THEN
            ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
          END IF;
        END $$;
      `);
      results.user_email_unique = 'ok';
    } catch (e: any) {
      results.user_email_unique = e.message;
    }

    // ══════════════════════════════════════════════════════════
    // 2. تنظيف المدير المكرر (admin-001 القديم)
    // ══════════════════════════════════════════════════════════
    try {
      await db.$executeRawUnsafe(`
        DELETE FROM "Admin" WHERE "email" = 'admin' AND "id" = 'admin-001'
      `);
      results.old_admin_deleted = 'ok';
    } catch (e: any) {
      results.old_admin_delete = e.message;
    }

    // ══════════════════════════════════════════════════════════
    // 3. التأكد من بيانات المدير
    // ══════════════════════════════════════════════════════════
    try {
      const admins = await db.$queryRawUnsafe(
        `SELECT id, email, name, "isDefaultPassword", 
          CASE WHEN LENGTH("password") > 20 THEN 'hashed' ELSE 'plain' END as pwd_type
         FROM "Admin" ORDER BY "createdAt"`
      ) as any[];
      results.admin_data = JSON.stringify(admins);

      // تحديث كلمة مرور المدير إذا كانت فارغة
      for (const admin of admins) {
        if (admin.pwd_type === 'plain' && (admin.email === 'admin@forexyemeni.com')) {
          const hashed = await hashPassword('Admin@123');
          await db.$executeRawUnsafe(`
            UPDATE "Admin" SET "password" = '${hashed}', "isDefaultPassword" = true
            WHERE "id" = '${admin.id}'
          `);
          results.admin_password_updated = `updated for ${admin.id}`;
        }
      }
    } catch (e: any) {
      results.admin_check_error = e.message;
    }

    // ══════════════════════════════════════════════════════════
    // 4. إنشاء جدول Statistic إذا لم يكن موجوداً
    // ══════════════════════════════════════════════════════════
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Statistic" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "totalTrades" INTEGER NOT NULL DEFAULT 0,
          "winTrades" INTEGER NOT NULL DEFAULT 0,
          "lossTrades" INTEGER NOT NULL DEFAULT 0,
          "period" TEXT NOT NULL DEFAULT 'ALL',
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      results.create_statistic_table = 'ok';
    } catch (e: any) {
      results.statistic_table = e.message;
    }

    // ══════════════════════════════════════════════════════════
    // 5. فحص نهائي
    // ══════════════════════════════════════════════════════════
    try {
      const tables = await db.$queryRawUnsafe(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      results.final_tables = JSON.stringify(tables);
    } catch (e: any) {
      results.final_tables_error = e.message;
    }

    try {
      const userCols = await db.$queryRawUnsafe(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'User'
        ORDER BY ordinal_position
      `);
      results.user_columns_final = JSON.stringify(userCols);
    } catch (e: any) {
      results.user_columns_final_error = e.message;
    }

    results.status = 'SUCCESS ✅';

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({
      status: 'ERROR ❌',
      fatal_error: error.message,
      results,
    }, { status: 500 });
  }
}
