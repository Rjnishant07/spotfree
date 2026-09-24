import { randomInt } from 'crypto';
import { NextResponse } from 'next/server';
import { isMailConfigured, sendOtpEmail } from '@/lib/mailer';
import { OTP_COOKIE, OTP_TTL_SECONDS, canSend, makeOtpToken, normalizeEmail } from '@/lib/otp';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email ?? ''));

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (!canSend(email)) {
    return NextResponse.json({ error: 'Please wait 30 seconds before requesting another code.' }, { status: 429 });
  }

  const otp = String(randomInt(100000, 1000000));

  if (!isMailConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Email service is not configured.' }, { status: 500 });
    }
    console.log(`[SpotFree OTP - SMTP not configured] ${email}: ${otp}`);
  } else {
    try {
      await sendOtpEmail(email, otp);
    } catch (err) {
      console.error('OTP email failed:', err);
      return NextResponse.json({ error: 'Could not send email. Try again.' }, { status: 502 });
    }
  }

  const res = NextResponse.json({ ok: true, mailed: isMailConfigured() });
  res.cookies.set(OTP_COOKIE, makeOtpToken(email, otp), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: OTP_TTL_SECONDS,
    path: '/',
  });
  return res;
}
