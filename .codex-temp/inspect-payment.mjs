import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';

const outDir = path.join(os.tmpdir(), 'docx-extract');
const xmlPath = path.join(outDir, 'unpacked', 'word', 'document.xml');
const xml = fs.readFileSync(xmlPath, 'utf8');

const needle = 'Порядок оплаты';
const idx = xml.indexOf(needle);
console.log('idx', idx);
console.log(xml.slice(Math.max(0, idx - 300), idx + 3500));

// Also find the 100% payment text pieces
for (const s of ['100 (сто)', 'предоплата', 'сто', 'пяти) рабочих']) {
  console.log('---', s, xml.indexOf(s));
}
