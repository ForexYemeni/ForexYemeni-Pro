import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureDatabase } from '@/lib/migrate';

export async function POST(request: NextRequest) {
  try {
    await ensureDatabase();
    const { userId, subscription } = await request.json();

    if (!userId || !subscription) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Store subscription in user record
    await db.$executeRawUnsafe(
      `UPDATE "User" SET "pushSubscription" = $1 WHERE id = $2`,
      subscription, userId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
