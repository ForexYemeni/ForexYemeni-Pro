import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOTP, sendOTPEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user - only allow resending OTP for unverified users
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

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await db.user.update({
      where: { email: normalizedEmail },
      data: { otp, otpExpiry },
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(normalizedEmail, otp);

    return NextResponse.json({
      success: true,
      message: 'تم إرسال رمز التحقق',
      emailSent,
      ...(process.env.NODE_ENV !== 'production' && !emailSent ? { devOTP: otp } : {}),
    });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال رمز التحقق' },
      { status: 500 }
    );
  }
}
