// Sends OTP mail through EmailJS + Gmail.

export const isMailConfigured = () =>
  !!(
    process.env.EMAILJS_PUBLIC_KEY &&
    process.env.EMAILJS_SERVICE_ID &&
    process.env.EMAILJS_TEMPLATE_ID
  );

export async function sendOtpEmail(to, otp) {
  // OTP expiry is 5 minutes, matching SpotFree's OTP logic.
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const time = expiresAt.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,

      template_params: {
        email: to,
        passcode: otp,
        time,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`EmailJS ${res.status}: ${body || 'send failed'}`);
  }
}
