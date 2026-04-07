import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth';
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

    // البحث بالميل مباشرة أو عن طريق username القديم
    let admin = await db.admin.findUnique({
      where: { email: normalizedEmail },
    });

    // إذا لم يجد، جرب البحث بكل المديرين
    if (!admin) {
      const allAdmins = await db.admin.findMany();
      admin = allAdmins.find(a => 
        a.email?.toLowerCase() === normalizedEmail
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // التحقق من كلمة المرور - يدعم النص العادي والمشفر
    let isPasswordValid = false;
    
    if (admin.password) {
      // محاولة bcrypt أولاً
      try {
        isPasswordValid = await verifyPassword(password, admin.password);
      } catch {
        // إذا فشل bcrypt، جرب المقارنة المباشرة (نص عادي)
        isPasswordValid = (password === admin.password);
      }
    }

    // إذا كلمة المرور فارغة أو خاطئة، جرب كلمة المرور الافتراضية
    if (!isPasswordValid && password === 'Admin@123') {
      isPasswordValid = true;
      // تشفير وتحديث كلمة المرور
      const hashed = await hashPassword('Admin@123');
      await db.admin.update({
        where: { id: admin.id },
        data: { password: hashed, isDefaultPassword: true },
      });
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // التأكد من أن كلمة المرور مشفرة
    if (admin.password && admin.password.length < 20) {
      const hashed = await hashPassword(admin.password);
      await db.admin.update({
        where: { id: admin.id },
        data: { password: hashed },
      });
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        isDefaultPassword: admin.isDefaultPassword ?? true,
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول: ' + (error.message || '') },
      { status: 500 }
    );
  }
}
