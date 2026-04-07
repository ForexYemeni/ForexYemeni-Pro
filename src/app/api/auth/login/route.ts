import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, generateSessionToken } from '@/lib/auth';
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

    // ═══════════════════════════════════════════════════
    // 1. البحث في جدول Admin أولاً
    // ═══════════════════════════════════════════════════
    try {
      const admin = await db.admin.findFirst({
        where: { email: normalizedEmail },
      });

      if (admin) {
        let isPasswordValid = false;

        // محاولة bcrypt
        try {
          isPasswordValid = await verifyPassword(password, admin.password);
        } catch {
          isPasswordValid = (password === admin.password);
        }

        // كلمة المرور الافتراضية تعمل دائماً
        if (!isPasswordValid && password === 'Admin@123') {
          isPasswordValid = true;
        }

        if (isPasswordValid) {
          // تشفير كلمة المرور إذا كانت نص عادي
          if (admin.password && admin.password.length < 20) {
            const { hashPassword } = await import('@/lib/auth');
            const hashed = await hashPassword(admin.password);
            await db.admin.update({
              where: { id: admin.id },
              data: { password: hashed },
            });
          }

          return NextResponse.json({
            success: true,
            role: 'admin',
            admin: {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              isDefaultPassword: admin.isDefaultPassword ?? true,
            },
          });
        }
      }
    } catch {}

    // ═══════════════════════════════════════════════════
    // 2. البحث في جدول User
    // ═══════════════════════════════════════════════════
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await verifyPassword(password, user.password);
    } catch {
      isPasswordValid = (password === user.password);
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    if (user.isVerified === false) {
      return NextResponse.json(
        { error: 'هذا الحساب لم يتم التحقق بعد', code: 'NOT_VERIFIED' },
        { status: 403 }
      );
    }

    const sessionToken = generateSessionToken();

    await db.user.update({
      where: { email: normalizedEmail },
      data: { sessionToken },
    });

    return NextResponse.json({
      success: true,
      role: 'user',
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول', details: String(error.message || '') },
      { status: 500 }
    );
  }
}
