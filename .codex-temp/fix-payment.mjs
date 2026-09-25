import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';

const outDir = path.join(os.tmpdir(), 'docx-extract');
const unpacked = path.join(outDir, 'unpacked');
const xmlPath = path.join(unpacked, 'word', 'document.xml');
let xml = fs.readFileSync(xmlPath, 'utf8');

const oldParagraph = `<w:p w14:paraId="20F10932" w14:textId="584C5843" w:rsidR="00434BEE" w:rsidRPr="006B3C23" w:rsidRDefault="006B3C23" w:rsidP="003E7830"><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:firstLine="567"/><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/></w:rPr><w:t xml:space="preserve">- </w:t></w:r><w:r w:rsidR="00434BEE" w:rsidRPr="006B3C23"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/></w:rPr><w:t>предоплата в размере 100 (ст</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/></w:rPr><w:t>о</w:t></w:r><w:r w:rsidR="00434BEE" w:rsidRPr="006B3C23"><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/></w:rPr><w:t>) % от стоимости, указанной в п. 2 настоящего Дополнительного соглашения, производится Заказчиком в течение 5 (пяти) рабочих дней с момента получения счета, выставленного Исполнителем после подписания настоящего Дополнительного соглашения.</w:t></w:r></w:p>`;

const rPr = `<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/></w:rPr>`;
const pPr = `<w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:ind w:firstLine="567"/><w:jc w:val="both"/>${rPr}</w:pPr>`;

const para1Text =
  '- предоплата в размере 50 (пятидесяти) % от стоимости, указанной в п. 2 настоящего Дополнительного соглашения, производится Заказчиком в течение 5 (пяти) рабочих дней с момента подписания настоящего Дополнительного соглашения;';

const para2Text =
  '- окончательный расчет в размере 50 (пятидесяти) % от стоимости, указанной в п. 2 настоящего Дополнительного соглашения, производится Заказчиком в течение 5 (пяти) рабочих дней после окончания работ над Bizon CMS и подписания Сторонами Акта оказанных услуг.';

function makeParagraph(paraId, textId, text) {
  return `<w:p w14:paraId="${paraId}" w14:textId="${textId}" w:rsidR="00434BEE" w:rsidRPr="006B3C23" w:rsidRDefault="006B3C23" w:rsidP="003E7830">${pPr}<w:r>${rPr}<w:t>${escapeXml(text)}</w:t></w:r></w:p>`;
}

function escapeXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (!xml.includes(oldParagraph)) {
  console.error('OLD PARAGRAPH NOT FOUND');
  process.exit(1);
}

const replacement =
  makeParagraph('20F10932', '584C5843', para1Text) +
  makeParagraph('A1B2C3D4', 'B2C3D4E5', para2Text);

xml = xml.replace(oldParagraph, replacement);
fs.writeFileSync(xmlPath, xml, 'utf8');

const desktop = String.raw`c:\Users\HP\Desktop`;
const originalPath = path.join(
  desktop,
  'Дополнительное соглашение_NDA-007-26_Bizon_CMS_2_TZ_TABLE.docx',
);
const outPath = path.join(
  desktop,
  'Дополнительное соглашение_NDA-007-26_Bizon_CMS_2_TZ_TABLE_50_50.docx',
);
const backupPath = path.join(
  desktop,
  'Дополнительное соглашение_NDA-007-26_Bizon_CMS_2_TZ_TABLE_backup_100pct.docx',
);

// Backup original once if not already backed up
if (!fs.existsSync(backupPath) && fs.existsSync(originalPath)) {
  try {
    fs.copyFileSync(originalPath, backupPath);
    console.log('Backup created:', backupPath);
  } catch (e) {
    console.log('Backup skipped:', e.code);
  }
}

// Rebuild docx: Compress-Archive creates zip; rename to docx
const zipOut = path.join(outDir, 'fixed.zip');
if (fs.existsSync(zipOut)) fs.unlinkSync(zipOut);

// Use .NET ZipFile to preserve structure (no root folder)
const ps = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$src = '${unpacked.replace(/'/g, "''")}'
$dst = '${zipOut.replace(/'/g, "''")}'
if (Test-Path $dst) { Remove-Item -LiteralPath $dst -Force }
$zip = [System.IO.Compression.ZipFile]::Open($dst, 'Create')
Get-ChildItem -LiteralPath $src -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($src.Length + 1).Replace('\\','/')
  [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Optimal)
}
$zip.Dispose()
`;

execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'inherit' });
fs.copyFileSync(zipOut, outPath);
console.log('Updated:', outPath);

// Verify text
const verifyXml = fs.readFileSync(xmlPath, 'utf8');
const text = verifyXml
  .replace(/<\/w:p>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&');
const start = text.indexOf('3. Порядок оплаты');
const end = text.indexOf('3.1.');
console.log('--- PAYMENT CLAUSE ---');
console.log(text.slice(start, end).trim());
