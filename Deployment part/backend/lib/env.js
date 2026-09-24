// Fail fast on a misconfigured production deploy instead of failing on the first user's login.
export function checkEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const e = process.env;
  const problems = [];
  const weak = (v) => !v || v.length < 32 || /change-?me/i.test(v);

  if (!e.DATABASE_URL) problems.push('DATABASE_URL is not set.');
  if (weak(e.OTP_SECRET)) problems.push('OTP_SECRET must be a random string of 32+ characters (openssl rand -hex 32).');
  if (weak(e.SESSION_SECRET)) problems.push('SESSION_SECRET must be a random string of 32+ characters (openssl rand -hex 32).');
  if (e.OTP_SECRET && e.OTP_SECRET === e.SESSION_SECRET) problems.push('OTP_SECRET and SESSION_SECRET must be different.');
  if (!e.RESEND_API_KEY) problems.push('RESEND_API_KEY is not set, so no login codes can be emailed.');
  if (!e.FRONTEND_URL) problems.push('FRONTEND_URL is not set (your deployed frontend URL).');

  if (problems.length) {
    console.error('\nInvalid production configuration:\n - ' + problems.join('\n - ') + '\n');
    process.exit(1);
  }

  if (!e.MAIL_FROM || /resend\.dev/i.test(e.MAIL_FROM)) {
    console.warn(
      '\n[warn] MAIL_FROM is the Resend test sender. Resend only delivers to the email you signed up with.\n' +
      '       Verify a domain in Resend and set MAIL_FROM=SpotFree <no-reply@yourdomain> so students receive codes.\n'
    );
  }
}
