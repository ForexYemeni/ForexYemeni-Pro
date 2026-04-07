import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOTP, sendOTPEmail } from '@/lib/auth';
import { ensureDatabase } from '@/lib/migrate';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'حساب غير موجود' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'هذا الحساب تم التحقق منه بالفعل. سجّل دخولك' },
        { status: 400 }
      );
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await db.user.update({
      where: { email: normalizedEmail },
      data: { otp, otpExpiry },
    });

    // محاولة إرسال البريد
    await sendOTPEmail(normalizedEmail, otp);

    // دائماً إرجاع OTP
    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق',
      devOTP: otp,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال رمز التحقق: ' + (error.message || '') },
      { status: 500 }
    );
  }
}
