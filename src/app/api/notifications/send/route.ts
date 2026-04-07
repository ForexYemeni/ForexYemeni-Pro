import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { title, body, type, tag } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body required' }, { status: 400 });
    }

    // Get all push subscriptions from approved users
    let subscriptions: string[] = [];
    try {
      const users = await db.$queryRawUnsafe(
        `SELECT "pushSubscription" FROM "User" WHERE "pushSubscription" IS NOT NULL AND "isApproved" = true`
      ) as any[];
      subscriptions = users.map(u => u.pushSubscription).filter(Boolean);
    } catch {}

    // Also get admin subscription
    try {
      const admins = await db.$queryRawUnsafe(
        `SELECT "pushSubscription" FROM "Admin" WHERE "pushSubscription" IS NOT NULL`
      ) as any[];
      // If type is 'admin', only send to admins
      if (type === 'admin') {
        subscriptions = admins.map(a => a.pushSubscription).filter(Boolean);
      }
    } catch {}

    const results = [];
    for (const subStr of subscriptions) {
      try {
        const subscription = JSON.parse(subStr);
        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '60',
          },
          body: JSON.stringify({
            title,
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            dir: 'rtl',
            lang: 'ar',
            tag: tag || `fy-${Date.now()}`,
            type: type || 'general',
            data: { url: '/' },
          }),
        });
        results.push({ status: response.status });
      } catch {}
    }

    return NextResponse.json({ success: true, sent: results.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
