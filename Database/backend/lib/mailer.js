// Sends mail through Resend's HTTP API (no SMTP, no personal password).
export const isMailConfigured = () => !!process.env.RESEND_API_KEY;

export async function sendOtpEmail(to, otp) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'SpotFree <onboarding@resend.dev>',
      to: [to],
      subject: `${otp} is your SpotFree login code`,
      text: `Your SpotFree login code is ${otp}. It expires in 5 minutes. If you didn't request this, ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px">
          <h2 style="margin:0 0 4px;color:#0f172a">Spot<span style="color:#059669">Free</span></h2>
          <p style="color:#475569;font-size:14px">Use this code to log in:</p>
          <div style="font-size:32px;font-weight:800;letter-spacing:8px;background:#f1f5f9;padding:14px;text-align:center;border-radius:12px;color:#0f172a">${otp}</div>
          <p style="color:#94a3b8;font-size:12px">Expires in 5 minutes. If you didn't request this, ignore this email.</p>
        </div>`,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Resend ${res.status}: ${body.message || 'send failed'}`);
  }
}
