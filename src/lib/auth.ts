import { db } from './db';
import bcrypt from 'bcryptjs';

// Hash a password using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify a password against a hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// التحقق من الجلسة
export async function getUserByToken(token: string | null) {
  if (!token) return null;
  try {
    const user = await db.user.findUnique({
      where: { sessionToken: token },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return user;
  } catch {
    return null;
  }
}

// توليد رمز OTP مكون من 6 أرقام
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// توليد رمز جلسة
export function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// إرسال OTP عبر Google Apps Script
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  const gasUrl = process.env.GAS_URL;

  if (!gasUrl) {
    // إذا لم يتم تعيين GAS_URL، لن يتم الإرسال (للتطوير)
    console.log(`OTP for ${email}: ${otp}`);
    return false;
  }

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_otp', email, otp }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}
