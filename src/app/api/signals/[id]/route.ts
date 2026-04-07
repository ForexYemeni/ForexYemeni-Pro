import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const signal = await db.signal.update({
      where: { id },
      data: body,
      include: {
        targets: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(signal);
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الإشارة' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.signal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الإشارة' },
      { status: 500 }
    );
  }
}
