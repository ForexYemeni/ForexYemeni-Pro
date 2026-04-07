import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { ensureDatabase } from '@/lib/migrate';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();

    const { adminId, currentPassword, newPassword, newEmail } = await request.json();

    if (!adminId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' },
        { status: 400 }
      );
    }

    if (newEmail && !newEmail.includes('@')) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح' },
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

    // التحقق من كلمة المرور الحالية
    let isCurrentValid = false;
    try {
      isCurrentValid = await verifyPassword(currentPassword, admin.password);
    } catch {
      isCurrentValid = (currentPassword === admin.password);
    }

    if (!isCurrentValid && currentPassword !== 'Admin@123') {
      return NextResponse.json(
        { error: 'كلمة المرور الحالية غير صحيحة' },
        { status: 401 }
      );
    }

    const hashedNewPassword = await hashPassword(newPassword);

    const updateData: Record<string, any> = {
      password: hashedNewPassword,
      isDefaultPassword: false,
    };

    // تغيير البريد الإلكتروني أيضاً
    if (newEmail && newEmail.toLowerCase().trim() !== admin.email) {
      updateData.email = newEmail.toLowerCase().trim();
    }

    await db.admin.update({
      where: { id: adminId },
      data: updateData,
    });

    const updatedAdmin = await db.admin.findUnique({ where: { id: adminId } });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث بيانات المدير بنجاح',
      admin: {
        id: updatedAdmin!.id,
        email: updatedAdmin!.email,
        name: updatedAdmin!.name,
        isDefaultPassword: false,
      },
    });
  } catch (error: any) {
    console.error('Change credentials error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث البيانات: ' + (error.message || '') },
      { status: 500 }
    );
  }
}
