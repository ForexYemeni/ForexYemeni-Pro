// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 ForexYemeni Pro - Webhook Bridge (جسر الويب هوك)
// TradingView → Google Apps Script → Vercel App
// ═══════════════════════════════════════════════════════════════════════════════

// ⚙️ رابط التطبيق
var APP_URL = 'https://forex-yemeni-pro.vercel.app';

// ═══════════════════════════════════════════════════════════════════════════════
// 📨 doPost - يستقبل الويب هوك من TradingView
// ═══════════════════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    var message = '';

    if (e.postData) {
      var contentType = e.postData.type || '';
      var body = e.postData.contents;

      if (contentType.indexOf('application/json') !== -1) {
        var json = JSON.parse(body);
        message = json.message || json.alert_message || json.text || json.data || body;
      } else if (contentType.indexOf('form') !== -1) {
        var params = body.split('&');
        for (var i = 0; i < params.length; i++) {
          var pair = params[i].split('=');
          if (pair[0] === 'message' || pair[0] === 'alert_message') {
            message = decodeURIComponent(pair[1]);
            break;
          }
        }
        if (!message) message = body;
      } else {
        message = body;
      }
    }

    if (!message) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false, error: 'لا توجد رسالة'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (message.indexOf('%') !== -1) {
      try { message = decodeURIComponent(message); } catch(err) {}
    }

    var response = UrlFetchApp.fetch(APP_URL + '/api/webhook', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ message: message }),
      muteHttpExceptions: true
    });

    var result = JSON.parse(response.getContentText());

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📨 doGet - للتحقق من أن الجسر يعمل
// ═══════════════════════════════════════════════════════════════════════════════
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'active',
    service: 'ForexYemeni Pro Webhook Bridge',
    app_url: APP_URL,
    message: 'الويب هوك يعمل ✅'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 إرسال رسالة إلى التطبيق
// ═══════════════════════════════════════════════════════════════════════════════
function sendToApp(message) {
  var url = APP_URL + '/api/webhook';

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ message: message }),
    muteHttpExceptions: true
  });

  return JSON.parse(response.getContentText());
}


// ═══════════════════════════════════════════════════════════════════════════════
// 🧪🧪🧪 دوال التجربة - اختر الدالة وشغّلها من القائمة أعلى المحرر
// ═══════════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════
// 🧪 اختبار 1: إشارة شراء XAUUSD (ذهب) - 10 أهداف
// ═══════════════════════════════════════════════════════════════════
function test_BUY_Signal() {
  var message = 'ForexYemeni_Gold |\n' +
    '🟢 إشارة شراء\n' +
    '📊 الزوج: XAUUSD\n' +
    '⏱️ الإطار الزمني: M15\n' +
    '💰 سعر الدخول: 2340.50\n' +
    '🛡️ نوع الوقف: ATR\n' +
    '🛑 الوقف: 2335.20\n' +
    '💰 حجم اللوت: 0.10 لوت قياسي\n' +
    '📊 المخاطرة: $5.00 (5%)\n' +
    '⭐⭐⭐\n' +
    '📈 الاتجاه متعدد الأطراف: BULLISH\n' +
    '📐 بنية SMC: BULLISH\n' +
    '🎯 الهدف 1: 2342.00\n' +
    '🎯 الهدف 2: 2344.50\n' +
    '🎯 الهدف 3: 2347.00\n' +
    '🎯 الهدف 4: 2350.00\n' +
    '🎯 الهدف 5: 2353.00\n' +
    '🎯 الهدف 6: 2356.00\n' +
    '🎯 الهدف 7: 2360.00\n' +
    '🎯 الهدف 8: 2365.00\n' +
    '🎯 الهدف 9: 2370.00\n' +
    '🎯 الهدف 10: 2375.00';

  var result = sendToApp(message);
  Logger.log('🧪 نتيجة اختبار شراء: ' + JSON.stringify(result, null, 2));
  return result;
}


// ═══════════════════════════════════════════════════════════════════
// 🧪 اختبار 2: إشارة بيع EURUSD (يورو دولار) - 10 أهداف
// ═══════════════════════════════════════════════════════════════════
function test_SELL_Signal() {
  var message = 'ForexYemeni_Gold |\n' +
    '🔴 إشارة بيع\n' +
    '📊 الزوج: EURUSD\n' +
    '⏱️ الإطار الزمني: H1\n' +
    '💰 سعر الدخول: 1.0850\n' +
    '🛡️ نوع الوقف: Swing\n' +
    '🛑 الوقف: 1.0890\n' +
    '💰 حجم اللوت: 0.05 لوت ميكرو\n' +
    '📊 المخاطرة: $3.00 (3%)\n' +
    '⭐⭐\n' +
    '📉 الاتجاه متعدد الأطراف: BEARISH\n' +
    '📐 بنية SMC: BEARISH\n' +
    '🎯 الهدف 1: 1.0835\n' +
    '🎯 الهدف 2: 1.0820\n' +
    '🎯 الهدف 3: 1.0800\n' +
    '🎯 الهدف 4: 1.0780\n' +
    '🎯 الهدف 5: 1.0755\n' +
    '🎯 الهدف 6: 1.0730\n' +
    '🎯 الهدف 7: 1.0700\n' +
    '🎯 الهدف 8: 1.0670\n' +
    '🎯 الهدف 9: 1.0640\n' +
    '🎯 الهدف 10: 1.0600';

  var result = sendToApp(message);
  Logger.log('🧪 نتيجة اختبار بيع: ' + JSON.stringify(result, null, 2));
  return result;
}


// ═══════════════════════════════════════════════════════════════════
// 🧪 اختبار 3: تحقق هدف واحد (الهدف 3 من XAUUSD)
// ═══════════════════════════════════════════════════════════════════
function test_TP_Hit_Single() {
  var message = 'ForexYemeni_Gold |\n' +
    '✅ تم تحقيق الهدف 3\n' +
    '📊 الزوج: XAUUSD\n' +
    '💰 السعر المحقق: 2347.00\n' +
    '🎉 عاشت ايدك!';

  var result = sendToApp(message);
  Logger.log('🧪 نتيجة اختبار تحقق هدف واحد: ' + JSON.stringify(result, null, 2));
  return result;
}


// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 اختبار 4: تحقق عدة أهداف (من الهدف 4 إلى 7)
// ═══════════════════════════════════════════════════════════════════
function test_TP_Hit_Multiple() {
  var message = 'ForexYemeni_Gold |\n' +
    '✅ جبنا الأهداف من 4 إلى 7\n' +
    '📊 الزوج: XAUUSD\n' +
    '💰 السعر: 2356.00\n' +
    '🎉 عاشت ايدك! فول تيك بروفيت!';

  var result = sendToApp(message);
  Logger.log('🧪 نتيجة اختبار تحقق عدة أهداف: ' + JSON.stringify(result, null, 2));
  return result;
}


// ═══════════════════════════════════════════════════════════════════
// 🧪 اختبار 5: ضرب وقف خسارة (SL) بدون أهداف محققة
// ═══════════════════════════════════════════════════════════════════
function test_SL_Hit_NoTP() {
  var message = 'ForexYemeni_Gold |\n' +
    '❌ ضرب الوقف\n' +
    '📊 الزوج: EURUSD\n' +
    '🛑 سعر الوقف: 1.0890\n' +
    '📉 عدد الأهداف المحققة: 0\n' +
    '😔 معوضين';

  var result = sendToApp(message);
  Logger.log('🧪 نتيجة اختبار ضرب وقف: ' + JSON.stringify(result, null, 2));
  return result;
}


// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 اختبار 6: ضرب وقف خسارة بعد تحقيق هدفين
// ═══════════════════════════════════════════════════════════════════════════════
function test_SL_Hit_WithTP() {
  var message = 'ForexYemeni_Gold |\n' +
    '❌ ضرب الوقف\n' +
    '📊 الزوج: XAUUSD\n' +
    '🛑 سعر الوقف: 2335.20\n' +
    '📉 عدد الأهداف المحققة: 3\n' +
    '😔 معوضين';

  var result = sendToApp(message);
  Logger.log('🧪 نتيجة اختبار ضرب وقف مع أهداف: ' + JSON.stringify(result, null, 2));
  return result;
}


// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 اختبار 7: تجربة كاملة - إشارة + أهداف + ضرب وقف
// ═══════════════════════════════════════════════════════════════════════════════
function test_FullScenario() {
  Logger.log('═══════════════════════════════════════');
  Logger.log('🧪 بداية التجربة الكاملة');
  Logger.log('═══════════════════════════════════════');

  // الخطوة 1: إشارة شراء
  Logger.log('\n📌 الخطوة 1: إرسال إشارة شراء GBPUSD...');
  var step1 = 'ForexYemeni_Gold |\n' +
    '🟢 إشارة شراء\n' +
    '📊 الزوج: GBPUSD\n' +
    '⏱️ الإطار الزمني: H4\n' +
    '💰 سعر الدخول: 1.2720\n' +
    '🛡️ نوع الوقف: FVG\n' +
    '🛑 الوقف: 1.2680\n' +
    '💰 حجم اللوت: 0.03 لوت ميكرو\n' +
    '📊 المخاطرة: $2.00 (2%)\n' +
    '⭐\n' +
    '🎯 الهدف 1: 1.2750\n' +
    '🎯 الهدف 2: 1.2780\n' +
    '🎯 الهدف 3: 1.2820\n' +
    '🎯 الهدف 4: 1.2860\n' +
    '🎯 الهدف 5: 1.2900\n' +
    '🎯 الهدف 6: 1.2940\n' +
    '🎯 الهدف 7: 1.2980\n' +
    '🎯 الهدف 8: 1.3020\n' +
    '🎯 الهدف 9: 1.3060\n' +
    '🎯 الهدف 10: 1.3100';

  var result1 = sendToApp(step1);
  Logger.log('✅ النتيجة: ' + JSON.stringify(result1));

  // انتظار ثانيتين
  Utilities.sleep(2000);

  // الخطوة 2: تحقق هدف 1 و 2
  Logger.log('\n📌 الخطوة 2: تحقق الهدف 1 و 2...');
  var step2 = 'ForexYemeni_Gold |\n' +
    '✅ جبنا الأهداف من 1 إلى 2\n' +
    '📊 الزوج: GBPUSD\n' +
    '🎉 عاشت ايدك!';

  var result2 = sendToApp(step2);
  Logger.log('✅ النتيجة: ' + JSON.stringify(result2));

  Utilities.sleep(2000);

  // الخطوة 3: تحقق هدف 3
  Logger.log('\n📌 الخطوة 3: تحقق الهدف 3...');
  var step3 = 'ForexYemeni_Gold |\n' +
    '✅ تم تحقيق الهدف 3\n' +
    '📊 الزوج: GBPUSD\n' +
    '💰 السعر: 1.2820\n' +
    '🎉 عاشت ايدك!';

  var result3 = sendToApp(step3);
  Logger.log('✅ النتيجة: ' + JSON.stringify(result3));

  Utilities.sleep(2000);

  // الخطوة 4: ضرب وقف
  Logger.log('\n📌 الخطوة 4: ضرب وقف الخسارة...');
  var step4 = 'ForexYemeni_Gold |\n' +
    '❌ ضرب الوقف\n' +
    '📊 الزوج: GBPUSD\n' +
    '🛑 سعر الوقف: 1.2680\n' +
    '📉 عدد الأهداف المحققة: 3\n' +
    '😔 معوضين';

  var result4 = sendToApp(step4);
  Logger.log('✅ النتيجة: ' + JSON.stringify(result4));

  Logger.log('\n═══════════════════════════════════════');
  Logger.log('🧪 انتهت التجربة الكاملة!');
  Logger.log('═══════════════════════════════════════');

  return {
    step1_buy: result1,
    step2_tp_hit: result2,
    step3_tp_hit: result3,
    step4_sl_hit: result4
  };
}
