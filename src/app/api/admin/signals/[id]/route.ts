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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const signal = await db.signal.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!signal) {
      return NextResponse.json({ error: 'الإشارة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ signal });
  } catch (error) {
    console.error('Get signal error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
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
    const body = await req.json();
    const { status, currentTP } = body;

    const signal = await db.signal.findUnique({ where: { id } });
    if (!signal) {
      return NextResponse.json({ error: 'الإشارة غير موجودة' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (currentTP !== undefined) updateData.currentTP = currentTP;
    if (status === 'HIT_TP' || status === 'HIT_SL') {
      updateData.currentTP = signal.totalTargets;
    }

    const updated = await db.signal.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message: 'تم تحديث الإشارة', signal: updated });
  } catch (error) {
    console.error('Update signal error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;

    const signal = await db.signal.findUnique({ where: { id } });
    if (!signal) {
      return NextResponse.json({ error: 'الإشارة غير موجودة' }, { status: 404 });
    }

    // Delete related records first
    await db.readSignal.deleteMany({ where: { signalId: id } });
    await db.signal.delete({ where: { id } });

    return NextResponse.json({ message: 'تم حذف الإشارة' });
  } catch (error) {
    console.error('Delete signal error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
