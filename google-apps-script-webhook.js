// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 Google Apps Script - جسر الويب هوك بين TradingView و ForexYemeni Pro
// ═══════════════════════════════════════════════════════════════════════════════
//
// 📋 كيفية الاستخدام:
// 1. اذهب إلى https://script.google.com
// 2. أنشئ مشروع جديد
// 3. الصق هذا الكود بالكامل
// 4. عدّل عنوان URL لتطبيقك في الأسفل (APP_URL)
// 5. اضغط Deploy > New deployment > Web app
// 6. اختر "Anyone" تحت Execute as و "Anyone" تحت Who has access
// 7. انسخ رابط الويب هوك وضعه في TradingView
//
// ═══════════════════════════════════════════════════════════════════════════════

// ⚙️ إعدادات التطبيق - عدّل هذا الرابط إلى عنوان تطبيقك
const APP_URL = 'https://your-app-url.com';  // ← ضع رابط تطبيقك هنا

// 🔑 مفتاح الأمان (اختياري - لتأمين الويب هوك)
const WEBHOOK_SECRET = 'forexyemeni-2024-secret-key';  // ← غيّره إلى مفتاحك الخاص

// ═══════════════════════════════════════════════════════════════════════════════
// 📨 doPost - يستقبل الويب هوك من TradingView
// ═══════════════════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    // 1. استخراج نص الرسالة من TradingView
    let message = '';
    
    if (e.postData) {
      message = e.postData.contents;
    }
    
    if (!message || message.trim() === '') {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'لا توجد بيانات في الطلب'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. محاولة تحليل JSON (TradingView يرسل JSON)
    try {
      const jsonData = JSON.parse(message);
      message = jsonData.message || jsonData.alert_message || jsonData.text || jsonData.data || message;
    } catch (parseError) {
      // إذا لم يكن JSON، نستخدم النص كما هو
      message = message;
    }

    // 3. فك تشفير URL Encoding إن وجد
    try {
      message = decodeURIComponent(message);
    } catch (decodeError) {
      // تجاهل خطأ فك التشفير
    }

    // 4. التحقق من أن الرسالة من المؤشر الصحيح
    if (!message.includes('ForexYemeni') && !message.includes('شراء') && !message.includes('بيع')) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'الرسالة ليست من مؤشر ForexYemeni'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. تسجيل الرسالة للمراجعة (اختياري)
    logMessage(message);

    // 6. إرسال الرسالة إلى تطبيقك
    const response = sendToApp(message);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      forwarded: true,
      appResponse: response,
      messagePreview: message.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
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
    message: 'الجسر يعمل بنجاح ✅',
    appUrl: APP_URL,
    timestamp: new Date().toISOString(),
    instructions: 'أرسل POST request مع الرسالة من TradingView'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 إرسال الرسالة إلى تطبيق ForexYemeni Pro
// ═══════════════════════════════════════════════════════════════════════════════
function sendToApp(message) {
  const url = APP_URL + '/api/webhook';
  
  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify({
      message: message,
      secret: WEBHOOK_SECRET,
      timestamp: new Date().toISOString()
    }),
    muteHttpExceptions: true,
    headers: {
      'User-Agent': 'ForexYemeni-Webhook-Bridge/1.0'
    }
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode >= 200 && responseCode < 300) {
      return {
        success: true,
        statusCode: responseCode,
        body: responseText
      };
    } else {
      return {
        success: false,
        statusCode: responseCode,
        error: responseText
      };
    }
  } catch (fetchError) {
    return {
      success: false,
      error: fetchError.toString()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 تسجيل الرسائل (Log) - للمراجعة والتتبع
// ═══════════════════════════════════════════════════════════════════════════════
function logMessage(message) {
  try {
    const sheetName = 'Webhook Log';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // إنشاء شيت جديد إذا لم يكن موجوداً
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // عناوين الأعمدة
      sheet.appendRow(['التاريخ والوقت', 'نوع الرسالة', 'الزوج', 'ملخص']);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }

    // تحديد نوع الرسالة
    let messageType = 'غير معروف';
    if (message.includes('تم تحقيق') || message.includes('عاشت ايدك') || message.includes('جبنا')) {
      messageType = 'تحقق هدف ✅';
    } else if (message.includes('ضرب الوقف') || message.includes('معوضين')) {
      messageType = 'ضرب وقف ❌';
    } else if (message.includes('شراء') || message.includes('بيع')) {
      messageType = 'إشارة دخول 🚀';
    }

    // استخراج الزوج
    const pairMatch = message.match(/الزوج:\s*([^\s|]+)/);
    const pair = pairMatch ? pairMatch[1].trim() : 'غير محدد';

    // إضافة السجل
    sheet.appendRow([
      new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Aden' }),
      messageType,
      pair,
      message.substring(0, 200)
    ]);

    // الاحتفاظ بآخر 100 سجل فقط
    const lastRow = sheet.getLastRow();
    if (lastRow > 101) {
      sheet.deleteRows(2, lastRow - 101);
    }

  } catch (logError) {
    // لا نوقف العملية إذا فشل التسجيل
    console.log('Log error: ' + logError.toString());
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 دالة اختبار - أرسل إشارة تجريبية للتطبيق
// ═══════════════════════════════════════════════════════════════════════════════
function testWebhook() {
  const testMessage = `ForexYemeni_Gold |
🟢 إشارة شراء
📊 الزوج: XAUUSD
⏱️ الإطار الزمني: M15
💰 سعر الدخول: 2340.50
🛡️ نوع الوقف: ATR
🛑 الوقف: 2335.20
💰 حجم اللوت: 0.10 لوت قياسي
📊 المخاطرة: $5.00 (5%)
⭐⭐
🎯 الهدف 1: 2342.00
🎯 الهدف 2: 2344.50
🎯 الهدف 3: 2347.00
🎯 الهدف 4: 2350.00
🎯 الهدف 5: 2353.00
🎯 الهدف 6: 2356.00
🎯 الهدف 7: 2360.00
🎯 الهدف 8: 2365.00
🎯 الهدف 9: 2370.00
🎯 الهدف 10: 2375.00`;

  const result = sendToApp(testMessage);
  Logger.log('Test Result: ' + JSON.stringify(result));
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 عرض آخر السجلات
// ═══════════════════════════════════════════════════════════════════════════════
function showLogs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Webhook Log');
  
  if (!sheet) {
    return 'لا توجد سجلات بعد';
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(-10); // آخر 10 سجلات

  let output = '📋 آخر 10 سجلات:\n\n';
  output += headers.join(' | ') + '\n';
  output += '-'.repeat(80) + '\n';
  
  rows.forEach(row => {
    output += row.join(' | ') + '\n';
  });

  Logger.log(output);
  return output;
}
