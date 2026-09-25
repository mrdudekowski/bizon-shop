$ErrorActionPreference = 'Stop'
Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

$dir = 'c:\Users\HP\Downloads\Telegram Desktop'
$bak = Get-ChildItem -LiteralPath $dir -Filter '*.docx' |
  Where-Object { $_.Name -like '*Bizon_CMS_2_backup_before_table*' } |
  Select-Object -First 1
$src = Get-ChildItem -LiteralPath $dir -Filter '*.docx' |
  Where-Object { $_.Name -like '*Bizon_CMS_2.docx' } |
  Select-Object -First 1
Copy-Item -LiteralPath $bak.FullName -Destination $src.FullName -Force
Write-Output ('TARGET=' + $src.FullName)

$stages = Get-Content -LiteralPath 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\tz-stages.json' -Encoding UTF8 -Raw | ConvertFrom-Json
$headers = Get-Content -LiteralPath 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\tz-headers.txt' -Encoding UTF8

$etap = ([string]([char]0x042D) + [char]0x0442 + [char]0x0430 + [char]0x043F + ' 1.')
$itogo = ([string]([char]0x0418) + [char]0x0422 + [char]0x041E + [char]0x0413 + [char]0x041E + ':')

$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $doc = $word.Documents.Open($src.FullName)

  $r1 = $doc.Content.Duplicate
  $f1 = $r1.Find
  $f1.ClearFormatting()
  $f1.Text = $etap
  $f1.Forward = $true
  $f1.Wrap = 0
  if (-not $f1.Execute()) { throw 'Etap not found' }
  $delStartPos = $r1.Start
  Write-Output ('DEL_START=' + $delStartPos)
  Write-Output ('MATCH1=' + $r1.Text.Substring(0, [Math]::Min(40, $r1.Text.Length)))

  $r2 = $doc.Range($delStartPos, $doc.Content.End)
  $f2 = $r2.Find
  $f2.ClearFormatting()
  $f2.Text = $itogo
  $f2.Forward = $true
  $f2.Wrap = 0
  if (-not $f2.Execute()) { throw 'Itogo not found' }
  $delEndPos = $r2.Start
  Write-Output ('DEL_END=' + $delEndPos)
  Write-Output ('MATCH2=' + $r2.Text.Substring(0, [Math]::Min(20, $r2.Text.Length)))

  if ($delEndPos -le $delStartPos) { throw 'Bad delete range' }

  $doc.Range($delStartPos, $delEndPos).Delete() | Out-Null

  $r3 = $doc.Content.Duplicate
  $f3 = $r3.Find
  $f3.ClearFormatting()
  $f3.Text = $itogo
  $f3.Forward = $true
  $f3.Wrap = 0
  if (-not $f3.Execute()) { throw 'Itogo missing after delete' }
  $insertAt = $doc.Range($r3.Start, $r3.Start)

  $cols = $headers.Count
  $table = $doc.Tables.Add($insertAt, ($stages.Count + 1), $cols)
  $table.Borders.Enable = $true
  $table.AllowAutoFit = $true

  for ($c = 1; $c -le $cols; $c++) {
    $cell = $table.Cell(1, $c)
    $cell.Range.Text = [string]$headers[$c - 1]
    $cell.Range.Font.Name = 'Times New Roman'
    $cell.Range.Font.Size = 8
    $cell.Range.Font.Bold = $true
    $cell.Range.ParagraphFormat.Alignment = 1
    $cell.Shading.BackgroundPatternColor = 15921906
  }

  for ($r = 0; $r -lt $stages.Count; $r++) {
    $s = $stages[$r]
    $vals = @([string]$s.n, [string]$s.name, [string]$s.work, [string]$s.result, [string]$s.term, [string]$s.excl, [string]$s.price)
    for ($c = 0; $c -lt $cols; $c++) {
      $cell = $table.Cell($r + 2, $c + 1)
      $cell.Range.Text = $vals[$c]
      $cell.Range.Font.Name = 'Times New Roman'
      $cell.Range.Font.Size = 8
      $cell.Range.ParagraphFormat.SpaceAfter = 0
      $cell.Range.ParagraphFormat.Alignment = $(if ($c -eq 0 -or $c -eq 6) { 1 } else { 0 })
    }
  }

  $widths = @(22, 75, 120, 75, 60, 80, 48)
  for ($c = 1; $c -le $cols; $c++) {
    try { $table.Columns.Item($c).Width = $widths[$c - 1] } catch {}
  }

  $doc.Save()
  $doc.Close()
  Write-Output 'SAVED_OK'
}
finally {
  $word.Quit() | Out-Null
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
