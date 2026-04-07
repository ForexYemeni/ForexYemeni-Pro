import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSessionToken } from '@/lib/auth';
import { ensureDatabase } from '@/lib/migrate';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'البريد ورمز التحقق مطلوبان' },
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

    if (!user.otp || user.otp !== otp) {
      return NextResponse.json(
        { error: 'رمز التحقق غير صحيح' },
        { status: 401 }
      );
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return NextResponse.json(
        { error: 'انتهت صلاحية رمز التحقق. أعد الإرسال' },
        { status: 410 }
      );
    }

    const sessionToken = generateSessionToken();

    await db.user.update({
      where: { email: normalizedEmail },
      data: {
        sessionToken,
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم التحقق بنجاح',
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحقق', details: String(error) },
      { status: 500 }
    );
  }
}
