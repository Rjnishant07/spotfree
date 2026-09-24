import { NextResponse } from 'next/server';
import { OTP_COOKIE, checkOtpToken, clearAttempts, normalizeEmail, registerAttempt } from '@/lib/otp';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email ?? ''));
  const otp = String(body.otp ?? '').trim();
  const token = request.headers.get('cookie')?.match(new RegExp(`${OTP_COOKIE}=([^;]+)`))?.[1];

  if (!token || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 400 });
  }
  if (!registerAttempt(email)) {
    return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });
  }
  if (!checkOtpToken(token, email, otp)) {
    return NextResponse.json({ error: 'Invalid or expired code.' }, { status: 401 });
  }

  clearAttempts(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(OTP_COOKIE);
  return res;
}
