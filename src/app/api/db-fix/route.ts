import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  const results: Record<string, string> = {};

  try {
    // 1. فحص الجداول الموجودة
    try {
      const tables = await db.$queryRawUnsafe(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      results.tables = JSON.stringify(tables);
    } catch (e: any) {
      results.tables_error = e.message;
    }

    // 2. فحص أعمدة Admin
    try {
      const adminCols = await db.$queryRawUnsafe(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Admin'
        ORDER BY ordinal_position
      `);
      results.admin_columns = JSON.stringify(adminCols);
    } catch (e: any) {
      results.admin_columns_error = e.message;
    }

    // 3. فحص أعمدة User
    try {
      const userCols = await db.$queryRawUnsafe(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'User'
        ORDER BY ordinal_position
      `);
      results.user_columns = JSON.stringify(userCols);
    } catch (e: any) {
      results.user_columns_error = e.message;
    }

    // 4. محاولة ترحيل Admin
    try {
      await db.$executeRawUnsafe(`
        ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "email" TEXT
      `);
      results.admin_add_email = 'ok';

      try {
        await db.$executeRawUnsafe(`
          DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Admin' AND column_name = 'username') THEN
              UPDATE "Admin" SET "email" = "username" WHERE "email" IS NULL OR "email" = '';
              ALTER TABLE "Admin" DROP COLUMN "username";
            END IF;
          END $$;
        `);
        results.admin_rename_username = 'ok';
      } catch (e: any) {
        results.admin_rename_username = e.message;
      }

      await db.$executeRawUnsafe(`
        ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "isDefaultPassword" BOOLEAN NOT NULL DEFAULT true
      `);
      results.admin_add_default_pwd = 'ok';

      try {
        await db.$executeRawUnsafe(`
          ALTER TABLE "Admin" ADD CONSTRAINT "Admin_email_key" UNIQUE ("email")
        `);
      } catch (e: any) {
        results.admin_unique_email = 'constraint exists or error: ' + e.message.substring(0, 100);
      }

    } catch (e: any) {
      results.admin_migration_error = e.message;
    }

    // 5. محاولة ترحيل User
    try {
      await db.$executeRawUnsafe(`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT NOT NULL DEFAULT ''
      `);
      results.user_add_password = 'ok';

      await db.$executeRawUnsafe(`
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT true
      `);
      results.user_add_verified = 'ok';

    } catch (e: any) {
      results.user_migration_error = e.message;
    }

    // 6. فحص وإنشاء بيانات المدير
    try {
      const admins = await db.$queryRawUnsafe(`SELECT id, email, name, "isDefaultPassword" FROM "Admin"`) as any[];
      results.admin_data = JSON.stringify(admins);
      
      if (admins.length === 0) {
        const hashed = await hashPassword('Admin@123');
        await db.$executeRawUnsafe(`
          INSERT INTO "Admin" ("id", "email", "password", "name", "isDefaultPassword", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), 'admin@forexyemeni.com', '${hashed}', 'المدير', true, NOW(), NOW())
        `);
        results.admin_created = 'ok';
      } else if (!admins[0].password || admins[0].password === '') {
        const hashed = await hashPassword('Admin@123');
        await db.$executeRawUnsafe(`
          UPDATE "Admin" SET "password" = '${hashed}', "isDefaultPassword" = true, "email" = 'admin@forexyemeni.com'
          WHERE "id" = '${admins[0].id}'
        `);
        results.admin_password_set = 'ok';
      }
    } catch (e: any) {
      results.admin_data_error = e.message;
    }

    // 7. فحص أعمدة بعد الترحيل
    try {
      const adminColsAfter = await db.$queryRawUnsafe(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Admin'
      `);
      results.admin_columns_after = JSON.stringify(adminColsAfter);
    } catch (e: any) {
      results.admin_after_error = e.message;
    }

    try {
      const userColsAfter = await db.$queryRawUnsafe(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'User'
      `);
      results.user_columns_after = JSON.stringify(userColsAfter);
    } catch (e: any) {
      results.user_after_error = e.message;
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({
      fatal_error: error.message,
      results,
    }, { status: 500 });
  }
}
