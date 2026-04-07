import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { targetId, status } = await request.json();

    if (!targetId || !status) {
      return NextResponse.json(
        { error: 'بيانات غير مكتملة' },
        { status: 400 }
      );
    }

    const updatedTarget = await db.signalTarget.update({
      where: { id: targetId },
      data: { status },
    });

    // Count hit targets and update signal
    const hitCount = await db.signalTarget.count({
      where: {
        signalId: id,
        status: 'HIT',
      },
    });

    await db.signal.update({
      where: { id },
      data: { tpReached: hitCount },
    });

    return NextResponse.json(updatedTarget);
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الهدف' },
      { status: 500 }
    );
  }
}
