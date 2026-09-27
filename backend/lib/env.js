// Fail fast on a misconfigured production deploy.

export function checkEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const e = process.env;
  const problems = [];

  const weak = (v) => !v || v.length < 32 || /change-?me/i.test(v);

  if (!e.DATABASE_URL) {
    problems.push('DATABASE_URL is not set.');
  }

  if (weak(e.OTP_SECRET)) {
    problems.push(
      'OTP_SECRET must be a random string of 32+ characters.'
    );
  }

  if (weak(e.SESSION_SECRET)) {
    problems.push(
      'SESSION_SECRET must be a random string of 32+ characters.'
    );
  }

  if (e.OTP_SECRET && e.OTP_SECRET === e.SESSION_SECRET) {
    problems.push(
      'OTP_SECRET and SESSION_SECRET must be different.'
    );
  }

  // EmailJS configuration
  if (!e.EMAILJS_SERVICE_ID) {
    problems.push('EMAILJS_SERVICE_ID is not set.');
  }

  if (!e.EMAILJS_TEMPLATE_ID) {
    problems.push('EMAILJS_TEMPLATE_ID is not set.');
  }

  if (!e.EMAILJS_PUBLIC_KEY) {
    problems.push('EMAILJS_PUBLIC_KEY is not set.');
  }

  if (!e.FRONTEND_URL) {
    problems.push(
      'FRONTEND_URL is not set (your deployed frontend URL).'
    );
  }

  if (problems.length) {
    console.error(
      '\nInvalid production configuration:\n - ' +
        problems.join('\n - ') +
        '\n'
    );

    process.exit(1);
  }
}
