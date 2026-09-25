import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import os from 'os';

const docx = String.raw`c:\Users\HP\Desktop\Дополнительное соглашение_NDA-007-26_Bizon_CMS_2_TZ_TABLE.docx`;
const outDir = path.join(os.tmpdir(), 'docx-extract');
fs.mkdirSync(outDir, { recursive: true });

// Expand via PowerShell Expand-Archive doesn't work on docx; copy as zip
const zipPath = path.join(outDir, 'doc.zip');
fs.copyFileSync(docx, zipPath);

execFileSync('powershell', [
  '-NoProfile',
  '-Command',
  `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${outDir.replace(/'/g, "''")}\\unpacked' -Force`,
]);

const xmlPath = path.join(outDir, 'unpacked', 'word', 'document.xml');
const xml = fs.readFileSync(xmlPath, 'utf8');

// Strip tags for readable text
const text = xml
  .replace(/<w:tab\/>/g, '\t')
  .replace(/<w:br\/>/g, '\n')
  .replace(/<\/w:p>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/\n{3,}/g, '\n\n');

fs.writeFileSync(path.join(outDir, 'plain.txt'), text, 'utf8');
fs.writeFileSync(path.join(outDir, 'document.xml'), xml, 'utf8');
console.log('OUTDIR', outDir);
console.log(text);
