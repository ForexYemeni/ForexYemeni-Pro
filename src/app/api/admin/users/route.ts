import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDatabase } from '@/lib/migrate';

// GET - قائمة جميع المستخدمين
export async function GET() {
  try {
    await ensureDatabase();
    const users = await db.$queryRawUnsafe(
      `SELECT id, email, name, role, "isVerified", "isApproved", "isBlocked", "createdAt" FROM "User" ORDER BY "createdAt" DESC`
    ) as any[];
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - تحديث حالة المستخدم (موافقة، حظر، حذف)
export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'user ID and action required' }, { status: 400 });
    }

    if (action === 'approve') {
      await db.$executeRawUnsafe(
        `UPDATE "User" SET "isApproved" = true, "isBlocked" = false WHERE id = $1`,
        userId
      );
      return NextResponse.json({ success: true, message: 'تمت الموافقة على المستخدم' });
    }

    if (action === 'reject') {
      await db.$executeRawUnsafe(
        `UPDATE "User" SET "isApproved" = false WHERE id = $1`,
        userId
      );
      return NextResponse.json({ success: true, message: 'تم رفض المستخدم' });
    }

    if (action === 'block') {
      await db.$executeRawUnsafe(
        `UPDATE "User" SET "isBlocked" = true, "isApproved" = false WHERE id = $1`,
        userId
      );
      return NextResponse.json({ success: true, message: 'تم حظر المستخدم' });
    }

    if (action === 'unblock') {
      await db.$executeRawUnsafe(
        `UPDATE "User" SET "isBlocked" = false WHERE id = $1`,
        userId
      );
      return NextResponse.json({ success: true, message: 'تم إلغاء حظر المستخدم' });
    }

    if (action === 'delete') {
      await db.$executeRawUnsafe(`DELETE FROM "User" WHERE id = $1`, userId);
      return NextResponse.json({ success: true, message: 'تم حذف المستخدم' });
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
