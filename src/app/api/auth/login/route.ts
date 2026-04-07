import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, generateSessionToken } from '@/lib/auth';
import { ensureDatabase } from '@/lib/migrate';

export async function POST(request: NextRequest) {
  try {
    // ترحيل قاعدة البيانات أولاً
    await ensureDatabase();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // التحقق من حالة الحساب
    if (user.isVerified === false) {
      return NextResponse.json(
        { error: 'هذا الحساب لم يتم التحقق بعد', code: 'NOT_VERIFIED' },
        { status: 403 }
      );
    }

    // إنشاء جلسة
    const sessionToken = generateSessionToken();

    await db.user.update({
      where: { email: normalizedEmail },
      data: { sessionToken },
    });

    return NextResponse.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول', details: String(error) },
      { status: 500 }
    );
  }
}
