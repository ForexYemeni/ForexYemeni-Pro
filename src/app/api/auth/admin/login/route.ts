import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { ensureDatabase } from '@/lib/migrate';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const admin = await db.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, admin.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        isDefaultPassword: admin.isDefaultPassword,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول', details: String(error) },
      { status: 500 }
    );
  }
}
