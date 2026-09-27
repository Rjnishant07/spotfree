// Post-deploy check. Usage: npm run smoke -- https://your-frontend.vercel.app
// Goes through the frontend URL, so it proves the Vercel -> backend proxy, the backend and the database all work.
const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) {
  console.error('Usage: npm run smoke -- https://your-frontend-url');
  process.exit(1);
}

const json = { 'Content-Type': 'application/json' };
const checks = [
  ['Frontend page loads', () => fetch(base + '/'), (r) => r.status === 200],
  ['Backend health (via proxy)', () => fetch(base + '/api/health'), async (r) => r.status === 200 && (await r.json()).ok === true],
  ['Signed-out session check', () => fetch(base + '/api/auth/me'), async (r) => r.status === 200 && (await r.json()).user === null],
  ['Protected data needs login', () => fetch(base + '/api/state'), (r) => r.status === 401],
  ['Bad email rejected', () => fetch(base + '/api/otp/send', { method: 'POST', headers: json, body: '{"email":"nope"}' }), (r) => r.status === 400],
  // Unknown non-campus email: the server must look it up in the database before refusing. 403 proves the DB works.
  ['Database reachable', () => fetch(base + '/api/otp/send', { method: 'POST', headers: json, body: '{"email":"smoke-test@example.com"}' }), (r) => r.status === 403],
];

let failed = 0;
for (const [name, run, ok] of checks) {
  try {
    const res = await run();
    const pass = await ok(res);
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass ? '' : `  (HTTP ${res.status})`}`);
    if (!pass) failed++;
  } catch (err) {
    console.log(`FAIL  ${name}  (${err.message})`);
    failed++;
  }
}
console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
