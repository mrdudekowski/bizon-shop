$p = 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\ds1-v2-after-table.txt'
$lines = Get-Content -LiteralPath $p -Encoding UTF8
$out = 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\ds1-v2-snippet.txt'
$start = 0
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -like '*Bizon CMS*' -and $i -gt 40) { $start = $i; break }
}
$end = [Math]::Min($start + 60, $lines.Count - 1)
$lines[$start..$end] | Set-Content -LiteralPath $out -Encoding UTF8
Write-Output ('START=' + $start + ' END=' + $end)
