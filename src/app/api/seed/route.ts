import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { ensureDatabase } from '@/lib/migrate';

export async function POST(request: NextRequest) {
  try {
    // ═══ الخطوة 1: ترحيل قاعدة البيانات ═══
    await ensureDatabase();

    // ═══ الخطوة 2: بيانات المدير الافتراضية ═══
    try {
      const existingAdmin = await db.admin.findFirst();

      if (!existingAdmin) {
        const defaultPassword = 'Admin@123';
        const hashedPassword = await hashPassword(defaultPassword);

        await db.admin.create({
          data: {
            email: 'admin@forexyemeni.com',
            password: hashedPassword,
            name: 'المدير',
            isDefaultPassword: true,
          },
        });
      } else if (!existingAdmin.password || existingAdmin.password === '') {
        // إذا المدير موجود لكن بدون كلمة مرور مشفرة (من النظام القديم)
        const hashedPassword = await hashPassword('Admin@123');
        await db.admin.update({
          where: { id: existingAdmin.id },
          data: {
            email: existingAdmin.email || 'admin@forexyemeni.com',
            password: hashedPassword,
            isDefaultPassword: true,
          },
        });
      }
    } catch (adminError) {
      console.error('Admin seed error:', adminError);
    }

    // ═══ لا توجد بيانات تجربة - الصفقات تأتي فقط من Google Apps Script ═══

    return NextResponse.json({ success: true, message: 'تم تهيئة البيانات بنجاح' });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تهيئة البيانات', details: String(error) },
      { status: 500 }
    );
  }
}
