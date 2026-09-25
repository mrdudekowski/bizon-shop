$ErrorActionPreference = 'Stop'
Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

$dir = 'c:\Users\HP\Downloads\Telegram Desktop'
$src = Get-ChildItem -LiteralPath $dir -Filter '*.docx' |
  Where-Object { $_.Name -like '*Bizon_CMS_2.docx' } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
$bak = Get-ChildItem -LiteralPath $dir -Filter '*.docx' |
  Where-Object { $_.Name -like '*Bizon_CMS_2_backup_before_table*' } |
  Select-Object -First 1

# Start from clean backup again
Copy-Item -LiteralPath $bak.FullName -Destination $src.FullName -Force
Write-Output ('BASE=' + $src.FullName)

$stages = Get-Content -LiteralPath 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\tz-stages.json' -Encoding UTF8 -Raw | ConvertFrom-Json

# Compact headers like main contract TZ
$hdrFile = 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\tz-headers-compact.txt'
$headers = Get-Content -LiteralPath $hdrFile -Encoding UTF8

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

  $r2 = $doc.Range($delStartPos, $doc.Content.End)
  $f2 = $r2.Find
  $f2.ClearFormatting()
  $f2.Text = $itogo
  $f2.Forward = $true
  $f2.Wrap = 0
  if (-not $f2.Execute()) { throw 'Itogo not found' }
  $delEndPos = $r2.Start

  $doc.Range($delStartPos, $delEndPos).Delete() | Out-Null

  $r3 = $doc.Content.Duplicate
  $f3 = $r3.Find
  $f3.ClearFormatting()
  $f3.Text = $itogo
  $f3.Forward = $true
  $f3.Wrap = 0
  if (-not $f3.Execute()) { throw 'Itogo missing' }
  $insertAt = $doc.Range($r3.Start, $r3.Start)

  # 5 columns: N | Name+details | qty | price | sum  + total row
  $rowCount = $stages.Count + 2 # header + stages + total
  $colCount = 5
  $table = $doc.Tables.Add($insertAt, $rowCount, $colCount)

  # Visible grid
  $table.Borders.Enable = $true
  foreach ($borderId in 1..6) {
    # wdBorderTop=1 ... insideV=6 etc - set all
    try {
      $b = $table.Borders.Item($borderId)
      $b.LineStyle = 1 # wdLineStyleSingle
      $b.LineWidth = 6 # wdLineWidth075pt approx? 6=0.75pt in some enums
      $b.Color = 0
    } catch {}
  }

  # Header
  for ($c = 1; $c -le $colCount; $c++) {
    $cell = $table.Cell(1, $c)
    $cell.Range.Text = [string]$headers[$c - 1]
    $cell.Range.Font.Name = 'Times New Roman'
    $cell.Range.Font.Size = 10
    $cell.Range.Font.Bold = $true
    $cell.Range.ParagraphFormat.Alignment = 1
    $cell.Shading.BackgroundPatternColor = 14277081
  }

  for ($i = 0; $i -lt $stages.Count; $i++) {
    $s = $stages[$i]
    $nameBlock = @(
      [string]$s.name
      ''
      '1. Sostav rabot: ' # placeholder replaced below
    ) -join "`r"

    # Build description in Russian from JSON fields
    $desc = [string]$s.name + "`r`r" +
      ([char]0x0421).ToString() + [char]0x043E + [char]0x0441 + [char]0x0442 + [char]0x0430 + [char]0x0432 + ' ' +
      ([char]0x0440) + [char]0x0430 + [char]0x0431 + [char]0x043E + [char]0x0442 + ': ' + [string]$s.work + "`r`r" +
      ([char]0x0420).ToString() + [char]0x0435 + [char]0x0437 + [char]0x0443 + [char]0x043B + [char]0x044C + [char]0x0442 + [char]0x0430 + [char]0x0442 + ': ' + [string]$s.result + "`r`r" +
      ([char]0x0421).ToString() + [char]0x0440 + [char]0x043E + [char]0x043A + ': ' + [string]$s.term + "`r`r" +
      ([char]0x041D).ToString() + [char]0x0435 + ' ' + [char]0x0432 + [char]0x0445 + [char]0x043E + [char]0x0434 + [char]0x0438 + [char]0x0442 + ': ' + [string]$s.excl

    # Load labels from file to avoid building Cyrillic in ps1
    $labels = Get-Content -LiteralPath 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\tz-row-labels.txt' -Encoding UTF8
    $desc = [string]$s.name + "`r`r" +
      $labels[0] + ' ' + [string]$s.work + "`r`r" +
      $labels[1] + ' ' + [string]$s.result + "`r`r" +
      $labels[2] + ' ' + [string]$s.term + "`r`r" +
      $labels[3] + ' ' + [string]$s.excl

    $vals = @(
      [string]$s.n,
      $desc,
      '1',
      [string]$s.price,
      [string]$s.price
    )
    $row = $i + 2
    for ($c = 0; $c -lt $colCount; $c++) {
      $cell = $table.Cell($row, $c + 1)
      $cell.Range.Text = $vals[$c]
      $cell.Range.Font.Name = 'Times New Roman'
      $cell.Range.Font.Size = 9
      $cell.Range.ParagraphFormat.SpaceAfter = 0
      if ($c -eq 0 -or $c -ge 2) { $cell.Range.ParagraphFormat.Alignment = 1 }
      else { $cell.Range.ParagraphFormat.Alignment = 0 }
    }
  }

  # Total row
  $totalLabels = Get-Content -LiteralPath 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\tz-total-label.txt' -Encoding UTF8
  $last = $rowCount
  $table.Cell($last, 1).Range.Text = ''
  $table.Cell($last, 2).Range.Text = [string]$totalLabels[0]
  $table.Cell($last, 3).Range.Text = ''
  $table.Cell($last, 4).Range.Text = ''
  $table.Cell($last, 5).Range.Text = '50 000,00'
  for ($c = 1; $c -le 5; $c++) {
    $cell = $table.Cell($last, $c)
    $cell.Range.Font.Name = 'Times New Roman'
    $cell.Range.Font.Size = 10
    $cell.Range.Font.Bold = $true
    $cell.Range.ParagraphFormat.Alignment = 1
  }

  # Fit table to page width
  $table.AutoFitBehavior(2) # wdAutoFitWindow
  $usable = [double]$doc.PageSetup.PageWidth - [double]$doc.PageSetup.LeftMargin - [double]$doc.PageSetup.RightMargin
  $w = @(
    [double]($usable * 0.08),
    [double]($usable * 0.52),
    [double]($usable * 0.10),
    [double]($usable * 0.15),
    [double]($usable * 0.15)
  )
  for ($c = 1; $c -le 5; $c++) {
    try { $table.Columns.Item($c).SetWidth($w[$c - 1], 0) } catch {
      try { $table.Columns.Item($c).Width = $w[$c - 1] } catch {}
    }
  }

  # Force borders again after autofit
  $table.Borders.InsideLineStyle = 1
  $table.Borders.OutsideLineStyle = 1
  $table.Borders.InsideLineWidth = 6
  $table.Borders.OutsideLineWidth = 6

  $desktopOut = 'c:\Users\HP\Desktop\DS1_NDA-007-26_Bizon_CMS_2_TZ_TABLE.docx'
  if (Test-Path -LiteralPath $desktopOut) { Remove-Item -LiteralPath $desktopOut -Force }
  $doc.Save()
  $doc.SaveAs([ref]$desktopOut, [ref]12) | Out-Null
  $doc.Close()
  Write-Output ('SAVED_TG=' + $src.FullName)
  Write-Output ('SAVED_DESKTOP=' + $desktopOut)
  Write-Output ('TABLE_ROWS=' + $rowCount)
}
finally {
  $word.Quit() | Out-Null
  [Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
