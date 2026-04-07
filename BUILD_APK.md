# 📱 بناء ملف APK لتطبيق ForexYemeni Pro

## 📋 المتطلبات الأساسية

قبل البدء، تأكد من تثبيت البرامج التالية على جهازك:

### 1. تثبيت Android Studio
- حمّل Android Studio من: https://developer.android.com/studio
- ثبّته مع الإعدادات الافتراضية
- خلال التثبيت، تأكد من اختيار:
  - ✅ Android SDK
  - ✅ Android SDK Platform
  - ✅ Android Virtual Device

### 2. تثبيت Java JDK 17
- حمّل من: https://adoptium.net/temurin/releases/
- اختر JDK 17 (LTS)

### 3. إعداد متغيرات البيئة
أضف الأسطر التالية إلى ملف `~/.bashrc` أو `~/.zshrc`:

```bash
# Android SDK
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Java
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin
```

ثم شغّل:
```bash
source ~/.bashrc
```

---

## 🚀 خطوات البناء

### الخطوة 1: نشر التطبيق على Vercel
```bash
# ادفع الكود إلى GitHub
git add -A
git commit -m "PWA setup for APK"
git push origin main

# اذهب إلى https://vercel.com ونشر المشروع
# تأكد من أن رابط التطبيق يعمل: https://forex-yemeni-pro.vercel.app
```

### الخطوة 2: إضافة منصة Android
```bash
cd /home/z/my-project
npx cap add android
```

### الخطوة 3: مزامنة التطبيق
```bash
npx cap sync android
```

### الخطوة 4: بناء الـ APK باستخدام Gradle

#### بناء Debug APK (للاختبار):
```bash
cd android
./gradlew assembleDebug
```
الملف سيكون في: `android/app/build/outputs/apk/debug/app-debug.apk`

#### بناء Release APK (للنشر):
```bash
cd android
./gradlew assembleRelease
```
الملف سيكون في: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 🔑 توقيع الـ APK للنشر على Google Play

### 1. إنشاء ملف توقيع (Keystore)
```bash
keytool -genkey -v -keystore forexyemeni-release.keystore \
  -alias forexyemeni \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### 2. إعداد التوقيع في Gradle
أنشئ ملف `android/forexyemeni.properties`:
```properties
storePassword=YOUR_PASSWORD
keyPassword=YOUR_PASSWORD
keyAlias=forexyemeni
storeFile=../forexyemeni-release.keystore
```

### 3. تعديل `android/app/build.gradle`
أضف داخل `android { ... }`:
```groovy
signingConfigs {
    release {
        def props = new Properties()
        def propFile = rootProject.file('forexyemeni.properties')
        if (propFile.exists()) {
            props.load(new FileInputStream(propFile))
        }
        storeFile file(props['storeFile'] ?: '../forexyemeni-release.keystore')
        storePassword props['storePassword'] ?: ''
        keyAlias props['keyAlias'] ?: ''
        keyPassword props['keyPassword'] ?: ''
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### 4. بناء الـ APK الموقّع
```bash
cd android
./gradlew assembleRelease
```

---

## 📲 تثبيت الـ APK على الجهاز

### عبر USB:
1. فعّل وضع المطور على هاتفك
2. فعّل USB Debugging
3. وصّل الهاتف بالكمبيوتر
4. شغّل:
```bash
cd android
./gradlew installDebug
```

### عبر رابط مباشر:
ارفع ملف `app-debug.apk` إلى أي خدمة استضافة وشارك الرابط

---

## 🔧 تخصيص الأيقونات

أيقونات التطبيق موجودة في:
- `/public/icon-512.png` - أيقونة 512x512
- `/public/icon-192.png` - أيقونة 192x192
- `/public/icon-1024.png` - أيقونة 1024x1024

لتحديث أيقونات Android:
```bash
# انسخ الأيقونات إلى مجلد Android
cp public/icon-512.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
cp public/icon-192.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png

# ثم أعد المزامنة
npx cap sync android
```

---

## ⚠️ ملاحظات مهمة

1. **التطبيق يعمل كـ TWA**: الـ APK يحمّل التطبيق من Vercel، لذا يجب أن يكون التطبيق منشوراً ومتاحاً
2. **PWA بدون Capacitor**: المستخدمون يمكنهم "إضافة إلى الشاشة الرئيسية" مباشرة من المتصفح على Android
3. **الإشعارات**: تعمل عبر Web Push API - لا تحتاج لخدمات مدفوعة
4. **الأصوات**: تستخدم Web Audio API - لا ملفات صوت خارجية مطلوبة

---

## 🛠️ حل المشاكل الشائعة

### خطأ: SDK not found
```bash
export ANDROID_HOME=$HOME/Android/Sdk
```

### خطأ: Gradle build failed
```bash
cd android
chmod +x gradlew
./gradlew clean
./gradlew assembleDebug
```

### خطأ: Java version
```bash
java -version  # يجب أن يكون 17
```

### تحديث الـ APK بعد تغيير الكود
```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```
