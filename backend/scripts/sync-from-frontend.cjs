// Keeps the backend's copy of the timetable + timetable/authority rules in sync with the frontend.
// Run from backend/ after editing HIT_TIMETABLE (frontend/lib/mockData.ts) or the rules in
// frontend/context/SpotFreeContext.tsx:   npm run sync   (needs `npm install` done in ../frontend)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const fe = path.join(__dirname, '../../frontend');
const be = path.join(__dirname, '..');
const ts = require(path.join(fe, 'node_modules/typescript'));

const cache = {};
function load(file) {
  if (cache[file]) return cache[file].exports;
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  cache[file] = mod;
  const req = (p) => {
    if (p.startsWith('@/')) return load(path.join(fe, p.slice(2)) + '.ts');
    if (p.startsWith('./')) return load(path.join(path.dirname(file), p) + '.ts');
    return {};
  };
  vm.runInNewContext(out, { module: mod, exports: mod.exports, require: req, console, Math, Date, JSON });
  return mod.exports;
}

const { HIT_TIMETABLE } = load(path.join(fe, 'lib/mockData.ts'));
fs.writeFileSync(path.join(be, 'data/timetable.json'), JSON.stringify(HIT_TIMETABLE));

const ctx = fs.readFileSync(path.join(fe, 'context/SpotFreeContext.tsx'), 'utf8');
const start = ctx.indexOf('export const PROTECTED_QR_ROOMS');
// The rules block ends where the frontend-only helpers begin (whichever comes first).
const ends = ['\nfunction parseMinutes(', '/**\n * Global 6:00 PM Real-Time Rule'].map((m) => ctx.indexOf(m, start)).filter((i) => i > 0);
const end = Math.min(...ends);
if (start < 0 || !ends.length) throw new Error('Could not find the rules block in SpotFreeContext.tsx');
const js = ts.transpileModule(ctx.slice(start, end), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
fs.writeFileSync(
  path.join(be, 'lib/rules.generated.js'),
  '// AUTO-PORTED from frontend/context/SpotFreeContext.tsx (timetable engine + authority rules).\n// Keep in sync if those functions change.\n' + js
);
console.log(`Synced ${HIT_TIMETABLE.length} timetable entries and the rules engine. Commit and redeploy the backend.`);
