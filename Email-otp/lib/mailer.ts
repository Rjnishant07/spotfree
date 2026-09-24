import nodemailer from 'nodemailer';

export const isMailConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

export async function sendOtpEmail(to: string, otp: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_PORT || '465') === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `SpotFree <${process.env.SMTP_USER}>`,
    to,
    subject: `${otp} is your SpotFree login code`,
    text: `Your SpotFree login code is ${otp}. It expires in 5 minutes. If you didn't request this, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px">
        <h2 style="margin:0 0 4px;color:#0f172a">Spot<span style="color:#059669">Free</span></h2>
        <p style="color:#475569;font-size:14px">Use this code to log in:</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;background:#f1f5f9;padding:14px;text-align:center;border-radius:12px;color:#0f172a">${otp}</div>
        <p style="color:#94a3b8;font-size:12px">Expires in 5 minutes. If you didn't request this, ignore this email.</p>
      </div>`,
  });
}
