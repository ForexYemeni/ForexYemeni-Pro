import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateOTP, sendOTPEmail } from '@/lib/auth';
import { ensureDatabase } from '@/lib/migrate';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور والاسم مطلوبون' },
        { status: 400 }
      );
    }

    if (!email.includes('@') || email.length < 5) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'الاسم مطلوب (حرفين على الأقل)' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'هذا البريد مسجل مسبقاً. سجّل دخولك' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await db.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        password: hashedPassword,
        role: 'user',
        isVerified: false,
        otp,
        otpExpiry,
      },
    });

    // محاولة إرسال البريد
    await sendOTPEmail(normalizedEmail, otp);

    // دائماً إرجاع OTP في الاستجابة
    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب. أدخل رمز التحقق',
      devOTP: otp,
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الحساب: ' + (error.message || '') },
      { status: 500 }
    );
  }
}
