import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const { plan } = await req.json();

    const validPlans = ['TRIAL', 'BASIC', 'PRO', 'VIP'];
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json({ error: 'خطة غير صالحة' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { plan };
    if (plan !== 'TRIAL') {
      updateData.trialEndsAt = null;
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: 'تم تحديث الخطة', user: updated });
  } catch (error) {
    console.error('Change plan error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
