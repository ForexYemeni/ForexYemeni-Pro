import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { adminId, currentPassword, newPassword } = await request.json();

    if (!adminId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    const admin = await db.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'حساب المدير غير موجود' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, admin.password);

    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'كلمة المرور الحالية غير صحيحة' },
        { status: 401 }
      );
    }

    // Hash new password and update
    const hashedNewPassword = await hashPassword(newPassword);

    await db.admin.update({
      where: { id: adminId },
      data: {
        password: hashedNewPassword,
        isDefaultPassword: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تغيير كلمة المرور' },
      { status: 500 }
    );
  }
}
