import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 Webhook Endpoint - يستقبل الإشارات من TradingView عبر Google Apps Script
// ═══════════════════════════════════════════════════════════════════════════

// تحديد نوع التنبيه من نص الرسالة
function detectAlertType(message: string): 'ENTRY' | 'TP_HIT' | 'SL_HIT' | 'UNKNOWN' {
  // دخول جديد = يحتوي شراء/بيع + لا يحتوي "تم تحقيق" أو "ضرب"
  if ((message.includes('شراء') || message.includes('بيع'))) {
    if (message.includes('تم تحقيق') || message.includes('عاشت ايدك') || message.includes('جبنا')) return 'TP_HIT';
    if (message.includes('ضرب الوقف') || message.includes('معوضين')) return 'SL_HIT';
    return 'ENTRY';
  }
  // تحقق هدف
  if (message.includes('تم تحقيق الهدف') || message.includes('عاشت ايدك') || message.includes('جبنا الهدف')) return 'TP_HIT';
  // ضرب وقف
  if (message.includes('ضرب الوقف') || message.includes('معوضين')) return 'SL_HIT';

  return 'UNKNOWN';
}

// ═══ تحليل إشارة الدخول الجديدة ═══
function parseEntrySignal(message: string) {
  const isBuy = message.includes('شراء') && !message.includes('بيع');

  // استخراج الزوج
  const pairMatch = message.match(/الزوج:\s*([^\s|]+)/);
  const pair = pairMatch ? pairMatch[1].trim() : '';

  // استخراج الإطار الزمني
  const tfMatch = message.match(/الإطار الزمني:\s*(\S+)/);
  const timeframe = tfMatch ? tfMatch[1] : '';

  // سعر الدخول
  const entryMatch = message.match(/سعر الدخول:\s*([\d,.]+)/);
  const entryPrice = entryMatch ? parseFloat(entryMatch[1].replace(',', '')) : 0;

  // نوع الوقف وسعره
  const slTypeMatch = message.match(/نوع الوقف:\s*([^\s|]+)/);
  const stopLossType = slTypeMatch ? slTypeMatch[1].trim() : 'ATR';

  const slPriceMatch = message.match(/الوقف:\s*([\d,.]+)/);
  const stopLoss = slPriceMatch ? parseFloat(slPriceMatch[1].replace(',', '')) : 0;

  // حجم اللوت (النص الكامل مثل "0.10 لوت قياسي")
  const lotMatch = message.match(/حجم اللوت:\s*(.+)/);
  const lotText = lotMatch ? lotMatch[1].trim() : '';
  const lotNumMatch = lotText.match(/([\d.]+)/);
  const lotSize = lotNumMatch ? parseFloat(lotNumMatch[1]) : 0;
  const lotType = lotText.replace(lotSize.toString(), '').trim() || lotText;

  // المخاطرة $X (Y%)
  const riskMatch = message.match(/\$\s*([\d,.]+)\s*\(\s*([\d,.]+)%\s*\)/);
  const riskAmount = riskMatch ? parseFloat(riskMatch[1].replace(',', '')) : 0;
  const riskPercent = riskMatch ? parseFloat(riskMatch[2].replace(',', '')) : 0;

  // عدد النجوم
  const starCount = (message.match(/⭐/g) || []).length;

  // الأهداف (10 أهداف)
  const targets: { order: number; price: number; percentage: number }[] = [];
  const targetRegex = /الهدف\s*(\d+)\s*:\s*([\d,.]+)/g;
  let tMatch;
  while ((tMatch = targetRegex.exec(message)) !== null) {
    targets.push({
      order: parseInt(tMatch[1]),
      price: parseFloat(tMatch[2].replace(',', '')),
      percentage: 10,
    });
  }

  // ═══ استخراج الحقول الإضافية من المؤشر ═══
  
  // نوع أسلوب التنبيه (عادي أو محسن عراقي)
  const isEnhanced = message.includes('المحسن') || message.includes('عراقي') || 
                     message.includes('عاشت ايدك') || message.includes('جبنا');
  const alertStyle = isEnhanced ? 'enhanced' : 'normal';

  // نوع وضع الأهداف (ATR / RR / Fibonacci / Swings)
  let tpMode = 'ATR';
  if (message.includes('فيبوناتشي') || message.includes('Fibonacci') || message.includes('FIB')) tpMode = 'Fibonacci';
  else if (message.includes('RR') || message.includes('نسبة المخاطرة') || message.includes('Risk Reward')) tpMode = 'RR';
  else if (message.includes('Swing') || message.includes('سوينج')) tpMode = 'Swings';

  // اسم الخطة من البادئة
  const planPrefixMatch = message.match(/^([^|]+)\|/);
  const planName = planPrefixMatch ? planPrefixMatch[1].trim() : 'ForexYemeni_Gold';

  // حجم العقد
  const contractMatch = message.match(/حجم العقد:\s*([\d,.]+)/) || 
                         message.match(/contractSize[:\s]*([\d,.]+)/i);
  const contractSize = contractMatch ? parseFloat(contractMatch[1].replace(',', '')) : 100;

  return {
    type: isBuy ? 'BUY' : 'SELL',
    pair,
    timeframe,
    entryPrice,
    stopLoss,
    stopLossType,
    lotSize,
    lotType,
    riskAmount,
    riskPercent,
    stars: Math.max(starCount, 1),
    targets,
    alertStyle,
    tpMode,
    planName,
    contractSize,
  };
}

// ═══ تحليل تحقق هدف ═══
function parseTPHit(message: string) {
  let fromTarget = 0;
  let toTarget = 0;

  // هدف واحد: "تم تحقيق الهدف 3" أو "جبنا الهدف 3"
  const singleMatch = message.match(/(?:تم تحقيق الهدف|جبنا الهدف)\s*(\d+)/);
  if (singleMatch) {
    fromTarget = parseInt(singleMatch[1]);
    toTarget = fromTarget;
  }

  // أهداف متعددة: "من 2 إلى 5"
  const jumpMatch = message.match(/من\s*(\d+)\s*إلى\s*(\d+)/);
  if (jumpMatch) {
    fromTarget = parseInt(jumpMatch[1]);
    toTarget = parseInt(jumpMatch[2]);
  }

  // هل تم إغلاق الصفقة بالكامل؟
  const allTPs = message.includes('إغلاق الصفقة بالكامل') || message.includes('قفلنا الصفقة') || message.includes('فول تيك بروفيت');

  // استخراج الزوج
  const pairMatch = message.match(/الزوج:\s*([^\s|]+)/);
  const pair = pairMatch ? pairMatch[1].trim() : '';

  return { pair, fromTarget, toTarget, allTPs };
}

// ═══ تحليل ضرب وقف ═══
function parseSLHit(message: string) {
  const pairMatch = message.match(/الزوج:\s*([^\s|]+)/);
  const pair = pairMatch ? pairMatch[1].trim() : '';

  // عدد أهداف محققة قبل الضرب
  const tpCountMatch = message.match(/عدد الأهداف المحققة:\s*(\d+)/);
  const tpCount = tpCountMatch ? parseInt(tpCountMatch[1]) : 0;

  // أو من "تم الوصول إلى الهدف X"
  const tpReachMatch = message.match(/تم الوصول إلى الهدف\s*(\d+)/);
  const tpReached = tpReachMatch ? parseInt(tpReachMatch[1]) : tpCount;

  return { pair, tpCount: Math.max(tpCount, tpReached) };
}

// ═══════════════════════════════════════════════════════════════════════════
// POST - استقبال التنبيه من TradingView
// ═══════════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    let body = await request.text();

    // استخراج نص الرسالة (يعمل مع JSON و Raw Text و Form-encoded)
    let message = body;
    try {
      const json = JSON.parse(body);
      message = json.message || json.alert_message || json.text || json.data || body;
    } catch {
      message = body;
    }

    // فك تشفير URL Encoding إن وجد
    if (message.includes('%')) {
      try { message = decodeURIComponent(message); } catch { /* ignore */ }
    }

    const alertType = detectAlertType(message);

    switch (alertType) {

      // ═════ إشارة دخول جديدة ═════
      case 'ENTRY': {
        const data = parseEntrySignal(message);

        if (!data.pair || !data.entryPrice) {
          return NextResponse.json({
            success: false,
            error: 'بيانات الإشارة غير مكتملة',
            parsed: { pair: data.pair, entry: data.entryPrice, targets: data.targets.length },
          }, { status: 400 });
        }

        // إغلاق أي إشارة نشطة سابقة لنفس الزوج
        await db.signal.updateMany({
          where: { pair: data.pair, status: 'ACTIVE' },
          data: { status: 'CLOSED' },
        });

        // إنشاء الإشارة الجديدة مع النص الأصلي كاملاً وجميع الحقول من المؤشر
        const signal = await db.signal.create({
          data: {
            type: data.type,
            pair: data.pair,
            timeframe: data.timeframe,
            entryPrice: data.entryPrice,
            stopLoss: data.stopLoss,
            stopLossType: data.stopLossType,
            lotSize: data.lotSize,
            lotType: data.lotType,
            riskAmount: data.riskAmount,
            riskPercent: data.riskPercent,
            balance: 100,
            stars: data.stars,
            mtfTrend: 'BULLISH',
            smcStructure: 'BULLISH',
            status: 'ACTIVE',
            tpReached: 0,
            alertText: message,
            alertStyle: data.alertStyle,
            tpMode: data.tpMode,
            planName: data.planName,
            contractSize: data.contractSize,
            targets: {
              create: data.targets.length > 0
                ? data.targets
                : Array.from({ length: 10 }, (_, i) => ({
                    order: i + 1,
                    price: 0,
                    percentage: 10,
                  })),
            },
          },
          include: { targets: { orderBy: { order: 'asc' } } },
        });

        return NextResponse.json({
          success: true,
          action: 'SIGNAL_CREATED',
          signalId: signal.id,
          pair: signal.pair,
          type: signal.type,
          targetsCount: signal.targets.length,
        });
      }

      // ═════ تحقق هدف ═════
      case 'TP_HIT': {
        const data = parseTPHit(message);

        if (!data.pair || data.fromTarget === 0) {
          return NextResponse.json({
            success: false,
            error: 'لم يتم تحديد الزوج أو رقم الهدف',
          }, { status: 400 });
        }

        // البحث عن الإشارة النشطة لهذا الزوج
        const activeSignal = await db.signal.findFirst({
          where: { pair: data.pair, status: 'ACTIVE' },
          include: { targets: { orderBy: { order: 'asc' } } },
        });

        if (!activeSignal) {
          return NextResponse.json({
            success: false,
            error: `لا توجد إشارة نشطة للزوج ${data.pair}`,
          });
        }

        // تعليم الأهداف كمحققة
        for (let i = data.fromTarget; i <= data.toTarget; i++) {
          await db.signalTarget.updateMany({
            where: { signalId: activeSignal.id, order: i, status: 'PENDING' },
            data: { status: 'HIT' },
          });
        }

        // تحديث حالة الإشارة
        const updateData: Record<string, unknown> = { tpReached: data.toTarget };
        if (data.allTPs) {
          updateData.status = 'TP_HIT';
        }

        await db.signal.update({
          where: { id: activeSignal.id },
          data: updateData,
        });

        return NextResponse.json({
          success: true,
          action: 'TP_UPDATED',
          pair: data.pair,
          fromTarget: data.fromTarget,
          toTarget: data.toTarget,
          allTPs: data.allTPs,
        });
      }

      // ═════ ضرب وقف ═════
      case 'SL_HIT': {
        const data = parseSLHit(message);

        // إذا كان في الرسالة زوج، ابحث عنه
        if (data.pair) {
          const activeSignal = await db.signal.findFirst({
            where: { pair: data.pair, status: 'ACTIVE' },
          });

          if (activeSignal) {
            await db.signal.update({
              where: { id: activeSignal.id },
              data: {
                status: data.tpCount > 0 ? 'CLOSED' : 'SL_HIT',
                tpReached: data.tpCount,
              },
            });

            return NextResponse.json({
              success: true,
              action: 'SL_HIT',
              pair: data.pair,
              tpCount: data.tpCount,
            });
          }
        }

        // إذا لم يوجد زوج، أغلق أقدم إشارة نشطة
        const oldestActive = await db.signal.findFirst({
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
        });

        if (oldestActive) {
          await db.signal.update({
            where: { id: oldestActive.id },
            data: {
              status: data.tpCount > 0 ? 'CLOSED' : 'SL_HIT',
              tpReached: data.tpCount,
            },
          });

          return NextResponse.json({
            success: true,
            action: 'SL_HIT',
            pair: oldestActive.pair,
            tpCount: data.tpCount,
          });
        }

        return NextResponse.json({
          success: false,
          error: 'لا توجد إشارات نشطة',
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'نوع الإشارة غير معروف',
          preview: message.substring(0, 200),
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json(
      { success: false, error: 'خطأ في معالجة الويب هوك', details: String(error) },
      { status: 500 }
    );
  }
}

// ═══ GET - للتحقق من أن الويب هوك يعمل ═══
export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'ForexYemeni Pro Webhook',
    message: 'الويب هوك يعمل بنجاح ✅',
    endpoints: {
      POST: '/api/webhook - استقبال إشارات من TradingView',
      GET: '/api/webhook - حالة الويب هوك',
    },
  });
}
