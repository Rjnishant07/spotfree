// Makes a printable sheet of door-plaque QR codes for every room in the database.
// Usage (from backend/, with DATABASE_URL in .env): npm run qr-sheet   ->   writes qr-sheet.html
// Open it in a browser and print (A4). Each code holds SPOTFREE:ROOM:<room id>, which the app's scanner understands.
import { writeFileSync } from 'fs';
import QRCode from 'qrcode';
import { pool } from '../lib/db.js';

const { rows } = await pool.query('SELECT data FROM rooms ORDER BY pos, id');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const cards = [];
for (const { data: r } of rows) {
  const svg = await QRCode.toString(`SPOTFREE:ROOM:${r.id}`, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
  cards.push(`<div class="card">${svg}<div class="id">${esc(r.id)}</div><div class="sub">${esc(r.building)} · Floor ${esc(r.floor)} · ${esc(r.type)}</div><div class="hint">Scan with SpotFree to check or update this room</div></div>`);
}

writeFileSync('qr-sheet.html', `<!doctype html><meta charset="utf-8"><title>SpotFree door plaques</title>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:12mm}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8mm}
  .card{border:1.5px dashed #94a3b8;border-radius:6mm;padding:6mm;text-align:center;break-inside:avoid}
  .card svg{width:62mm;height:62mm}
  .id{font-size:22pt;font-weight:800;color:#0f172a}
  .sub{font-size:10pt;color:#475569;margin-top:1mm}
  .hint{font-size:8pt;color:#94a3b8;margin-top:2mm}
  @media print{body{padding:8mm}}
</style><div class="grid">${cards.join('\n')}</div>`);
console.log(`Wrote qr-sheet.html with ${rows.length} plaques. Open it in a browser and print.`);
await pool.end();
