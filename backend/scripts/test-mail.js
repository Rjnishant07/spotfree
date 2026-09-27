// Usage: npm run test-mail -- someone@example.com
// Sends one real OTP-style email so you can check delivery, sender name and spam placement before deploying.
import { isMailConfigured, sendOtpEmail } from '../lib/mailer.js';

const to = process.argv[2];
if (!to) {
  console.error('Usage: npm run test-mail -- you@example.com');
  process.exit(1);
}
if (!isMailConfigured()) {
  console.error('RESEND_API_KEY is not set in backend/.env');
  process.exit(1);
}

console.log(`Sending from: ${process.env.MAIL_FROM || 'SpotFree <onboarding@resend.dev>'}`);
console.log(`Sending to:   ${to}`);
try {
  await sendOtpEmail(to, '123456');
  console.log('Sent. Check the inbox (and spam) for "123456 is your SpotFree login code".');
} catch (err) {
  console.error('FAILED:', err.message);
  process.exit(1);
}
