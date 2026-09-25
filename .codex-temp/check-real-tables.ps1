$ErrorActionPreference = 'Stop'
Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 300

$files = @(
  (Get-ChildItem 'c:\Users\HP\Downloads\Telegram Desktop' -Filter '*.docx' | Where-Object { $_.Name -like '*Bizon_CMS_2.docx' } | Select-Object -First 1).FullName,
  'c:\Users\HP\Desktop\DS1_NDA-007-26_Bizon_CMS_2_TZ_TABLE.docx'
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$lines = New-Object System.Collections.Generic.List[string]
try {
  foreach ($f in $files) {
    if (-not (Test-Path -LiteralPath $f)) { $lines.Add('MISSING=' + $f); continue }
    $doc = $word.Documents.Open($f)
    $lines.Add('FILE=' + $f)
    $lines.Add('TABLES=' + $doc.Tables.Count)
    for ($t = 1; $t -le $doc.Tables.Count; $t++) {
      $tb = $doc.Tables.Item($t)
      $c11 = ($tb.Cell(1,1).Range.Text -replace '[\r\a\n]','').Trim()
      $lines.Add(('T{0}: {1}x{2} bordersIn={3} cell11={4}' -f $t, $tb.Rows.Count, $tb.Columns.Count, [int]$tb.Borders.InsideLineStyle, $c11))
    }
    # Confirm TZ intro intact
    $txt = $doc.Content.Text
    $marker = '50 000'
    $lines.Add('HAS_50000=' + $txt.Contains($marker))
    $doc.Close($false)
  }
} finally {
  $word.Quit() | Out-Null
  [Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
$out = 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\tz-table-check.txt'
[IO.File]::WriteAllLines($out, $lines, [Text.UTF8Encoding]::new($false))
$lines | ForEach-Object { Write-Output $_ }
