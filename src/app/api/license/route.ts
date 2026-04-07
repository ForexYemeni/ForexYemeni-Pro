import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const licenses = await db.licenseKey.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(licenses);
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب التراخيص' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    if (!plan || !['BASIC', 'PRO', 'VIP'].includes(plan)) {
      return NextResponse.json(
        { error: 'خطة الترخيص غير صالحة' },
        { status: 400 }
      );
    }

    const code = 'FY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const license = await db.licenseKey.create({
      data: {
        code,
        plan,
        isActive: true,
      },
    });

    return NextResponse.json(license, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الترخيص' },
      { status: 500 }
    );
  }
}
