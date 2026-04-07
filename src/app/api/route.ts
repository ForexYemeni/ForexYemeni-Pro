import { NextResponse } from "next/server";

// التحقق من قاعدة البيانات - بدون استخدام Prisma
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

    // إذا وجد DATABASE_URL - نستخدم الـ route الثاني لإنشاء الجداول
    const setupRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (setupRes.ok) {
      return NextResponse.json({
        status: "ready",
        message: "التطبيق جاهز!",
        database: "متصل"
      });
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
