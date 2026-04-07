import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateOTP, sendOTPEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور والاسم مطلوبون' },
        { status: 400 }
      );
    }

    // Validate email
    if (!email.includes('@') || email.length < 5) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }

    // Validate password (min 6 chars)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // Validate name
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'الاسم مطلوب (حرفين على الأقل)' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'هذا البريد مسجل مسبقاً. سجّل دخولك' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create user (not verified yet)
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

    // Send OTP email
    const emailSent = await sendOTPEmail(normalizedEmail, otp);

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب. أدخل رمز التحقق المرسل إلى بريدك',
      emailSent,
      ...(process.env.NODE_ENV !== 'production' && !emailSent ? { devOTP: otp } : {}),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الحساب' },
      { status: 500 }
    );
  }
}
