import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// إنشاء الجداول تلقائياً عند أول طلب - يعمل مع Neon PostgreSQL
export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return NextResponse.json({
        status: "no_database",
        message: "لم يتم إعداد قاعدة البيانات بعد",
        setup: "اذهب إلى Vercel > Storage > اختر Neon > Create Database"
      });
    }

    // إنشاء الجداول عبر Prisma $executeRawUnsafe
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Admin" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `);

    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Admin_username_key" ON "Admin"("username")
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Signal" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "type" TEXT NOT NULL,
        "pair" TEXT NOT NULL,
        "timeframe" TEXT NOT NULL,
        "entryPrice" DOUBLE PRECISION NOT NULL,
        "stopLoss" DOUBLE PRECISION NOT NULL,
        "stopLossType" TEXT NOT NULL DEFAULT 'ATR',
        "riskPercent" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
        "riskAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "lotSize" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "lotType" TEXT NOT NULL DEFAULT '',
        "balance" DOUBLE PRECISION NOT NULL DEFAULT 100,
        "stars" INTEGER NOT NULL DEFAULT 1,
        "mtfTrend" TEXT NOT NULL DEFAULT 'BULLISH',
        "smcStructure" TEXT NOT NULL DEFAULT 'BULLISH',
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "tpReached" INTEGER NOT NULL DEFAULT 0,
        "alertText" TEXT NOT NULL DEFAULT '',
        "alertStyle" TEXT NOT NULL DEFAULT 'normal',
        "tpMode" TEXT NOT NULL DEFAULT 'ATR',
        "planName" TEXT NOT NULL DEFAULT 'ForexYemeni_Gold',
        "contractSize" DOUBLE PRECISION NOT NULL DEFAULT 100,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SignalTarget" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "signalId" TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        "price" DOUBLE PRECISION NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
        CONSTRAINT "SignalTarget_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "SignalTarget_signalId_idx" ON "SignalTarget"("signalId")
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LicenseKey" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL,
        "plan" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "usedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "LicenseKey_code_key" ON "LicenseKey"("code")
    `);

    // بيانات أولية - مدير
    const admins = await db.$queryRawUnsafe<{ id: string }[]>(`SELECT id FROM "Admin" WHERE username = 'admin' LIMIT 1`);
    if (admins.length === 0) {
      await db.$executeRawUnsafe(`
        INSERT INTO "Admin" (id, username, password, name, "createdAt", "updatedAt") 
        VALUES ('admin-001', 'admin', 'forex2024', 'المدير العام', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
    }

    // بيانات أولية - تراخيص
    const licenses = await db.$queryRawUnsafe<{ id: string }[]>(`SELECT id FROM "LicenseKey" LIMIT 1`);
    if (licenses.length === 0) {
      await db.$executeRawUnsafe(`INSERT INTO "LicenseKey" (id, code, plan, "isActive", "createdAt") VALUES ('lic-1', 'FY-PRO-2024-A1B2', 'PRO', true, CURRENT_TIMESTAMP)`);
      await db.$executeRawUnsafe(`INSERT INTO "LicenseKey" (id, code, plan, "isActive", "createdAt") VALUES ('lic-2', 'FY-VIP-2024-C3D4', 'VIP', true, CURRENT_TIMESTAMP)`);
      await db.$executeRawUnsafe(`INSERT INTO "LicenseKey" (id, code, plan, "isActive", "createdAt") VALUES ('lic-3', 'FY-BASIC-2024-E5F6', 'BASIC', true, CURRENT_TIMESTAMP)`);
    }

    return NextResponse.json({
      status: "ready",
      message: "التطبيق جاهز!",
      database: "متصل"
    });

  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: "خطأ في قاعدة البيانات",
      error: String(error),
      hint: "تأكد من إنشاء قاعدة بيانات Neon في Vercel > Storage"
    }, { status: 500 });
  }
}
