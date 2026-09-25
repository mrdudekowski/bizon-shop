import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';

const outDir = path.join(os.tmpdir(), 'docx-extract');
const unpacked = path.join(outDir, 'unpacked');
const zipOut = path.join(outDir, 'fixed.zip');
const outPath = String.raw`c:\Users\HP\Desktop\Дополнительное соглашение_NDA-007-26_Bizon_CMS_2_TZ_TABLE_50_50.docx`;

if (fs.existsSync(zipOut)) fs.unlinkSync(zipOut);

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
console.log('Saved:', outPath);

const xml = fs.readFileSync(path.join(unpacked, 'word', 'document.xml'), 'utf8');
const text = xml.replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
const start = text.indexOf('3. Порядок оплаты');
const end = text.indexOf('3.1.');
console.log(text.slice(start, end).trim());
