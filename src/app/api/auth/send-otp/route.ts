import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOTP, sendOTPEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, name, mode } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (mode === 'register') {
      // تسجيل جديد
      if (!name || name.trim().length < 2) {
        return NextResponse.json(
          { error: 'الاسم مطلوب (حرفين على الأقل)' },
          { status: 400 }
        );
      }

      const existing = await db.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'هذا البريد مسجل مسبقاً. سجّل دخولك' },
          { status: 409 }
        );
      }

      // إنشاء الحساب مع OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 دقائق

      await db.user.create({
        data: {
          email: normalizedEmail,
          name: name.trim(),
          role: 'user',
          otp,
          otpExpiry,
        },
      });

      // محاولة إرسال البريد
      const emailSent = await sendOTPEmail(normalizedEmail, otp);

      return NextResponse.json({
        success: true,
        message: 'تم إنشاء الحساب. أدخل رمز التحقق',
        emailSent,
        // للتجربة: إرجاع OTP إذا لم يتم إرسال البريد
        ...(process.env.NODE_ENV !== 'production' && !emailSent ? { devOTP: otp } : {}),
      });

    } else {
      // تسجيل دخول
      const user = await db.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'حساب غير موجود. سجّل أولاً' },
          { status: 404 }
        );
      }

      // توليد OTP جديد
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      await db.user.update({
        where: { email: normalizedEmail },
        data: { otp, otpExpiry },
      });

      // محاولة إرسال البريد
      const emailSent = await sendOTPEmail(normalizedEmail, otp);

      return NextResponse.json({
        success: true,
        message: 'تم إرسال رمز التحقق',
        emailSent,
        ...(process.env.NODE_ENV !== 'production' && !emailSent ? { devOTP: otp } : {}),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال رمز التحقق' },
      { status: 500 }
    );
  }
}
