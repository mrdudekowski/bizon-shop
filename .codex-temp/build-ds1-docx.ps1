$ErrorActionPreference = 'Stop'
$contentPath = 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\ds1-bizon-cms-content.txt'
$outPath = 'c:\Users\HP\Desktop\DS1_NDA-007-26_Bizon_CMS.docx'

# Close lingering Word if locking the file
Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

$text = [System.IO.File]::ReadAllText($contentPath, [System.Text.UTF8Encoding]::new($false))
$text = $text.Replace([string][char]0x2014, '-').Replace([string][char]0x2013, '-').Replace([string][char]0x2026, '...')

$parts = $text -split '===APPENDIX==='
$main = $parts[0].Trim()
$appendix = if ($parts.Count -gt 1) { $parts[1].Trim() } else { '' }

function Set-BodyStyle($sel) {
  $sel.Font.Name = 'Times New Roman'
  $sel.Font.Size = 12
  $sel.Font.Bold = $false
  $sel.ParagraphFormat.SpaceBefore = 0
  $sel.ParagraphFormat.SpaceAfter = 0
  $sel.ParagraphFormat.LineSpacingRule = 0
  $sel.ParagraphFormat.FirstLineIndent = 0
  $sel.ParagraphFormat.Alignment = 3
}

function Write-PlainLines($sel, $wordApp, [string[]]$lines, [bool]$isAppendix) {
  $i = 0
  foreach ($raw in $lines) {
    $trim = $raw.TrimEnd()
    if ($trim.StartsWith('@@')) { continue }

    Set-BodyStyle $sel

    if ($trim -eq '') {
      $sel.TypeParagraph()
      $i++
      continue
    }

    $hasTab = $trim.Contains("`t")
    $isSection = ($trim -match '^\d+\.\s') -and ($trim -notmatch '^\d+\.\d+')
    $isClause = ($trim -match '^\d+\.\d+')
    $isStage = ($trim -match '^[^\d].{0,40}\d+\.\s') -and ($trim -notmatch '^\d')
    $isShortCentered = (-not $isClause) -and (-not $isSection) -and ($trim.Length -lt 90) -and ($trim -notmatch '^\d') -and (
      ($i -lt 8) -or ($isAppendix -and $i -lt 8) -or
      ($trim -match '^(Adresa|Podpisi)') -eq $false
    )
    # Center known short headings by length + no trailing period + not starting with digit/dash
    if ((-not $isClause) -and (-not $isSection) -and ($trim.Length -lt 70) -and ($trim -notmatch '^\d') -and ($trim -notmatch '^-') -and ($trim -notmatch ':\s*$') -and ($trim -match '^[^\.]+$') -and ($i -lt 12 -or $isAppendix)) {
      if ($trim.Length -lt 55) { $isShortCentered = $true }
    }

    if ($isShortCentered) {
      $sel.Font.Bold = $true
      $sel.Font.Size = 14
      $sel.ParagraphFormat.Alignment = 1
      $sel.ParagraphFormat.SpaceAfter = 6
    } elseif ($hasTab) {
      $sel.ParagraphFormat.Alignment = 0
      $sel.ParagraphFormat.TabStops.ClearAll()
      [void]$sel.ParagraphFormat.TabStops.Add($wordApp.CentimetersToPoints(16), 2)
    } elseif ($isSection -or $isStage) {
      $sel.Font.Bold = $true
      $sel.ParagraphFormat.Alignment = 1
      $sel.ParagraphFormat.SpaceBefore = 10
      $sel.ParagraphFormat.SpaceAfter = 6
    } elseif ($isClause) {
      $sel.ParagraphFormat.Alignment = 3
      $sel.ParagraphFormat.SpaceAfter = 4
    } else {
      $sel.ParagraphFormat.Alignment = 3
      $sel.ParagraphFormat.SpaceAfter = 4
      if ($trim.Length -gt 90) {
        $sel.ParagraphFormat.FirstLineIndent = $wordApp.CentimetersToPoints(1.25)
      }
    }

    $sel.TypeText($trim)
    $sel.TypeParagraph()
    $i++
  }
}

function Add-TwoColTable($sel, [string]$leftText, [string]$rightText) {
  $doc = $sel.Document
  $range = $sel.Range
  $table = $doc.Tables.Add($range, 1, 2)
  $table.Borders.Enable = $false
  $table.AllowAutoFit = $true
  $table.Columns.Item(1).Width = $sel.Application.CentimetersToPoints(8.5)
  $table.Columns.Item(2).Width = $sel.Application.CentimetersToPoints(8.5)

  function Set-CellLines($cell, [string[]]$cellLines) {
    $cell.Range.Text = ''
    $rng = $cell.Range
    $rng.Collapse(1) # start
    for ($li = 0; $li -lt $cellLines.Count; $li++) {
      $rng.Text = $cellLines[$li]
      $rng.Font.Name = 'Times New Roman'
      $rng.Font.Size = 11
      $rng.ParagraphFormat.SpaceAfter = 2
      $rng.ParagraphFormat.FirstLineIndent = 0
      $rng.ParagraphFormat.Alignment = 0
      if ($li -lt ($cellLines.Count - 1)) {
        $rng.InsertParagraphAfter() | Out-Null
        $rng.Collapse(0)
      }
    }
  }

  $leftLines = @($leftText -split "`r?`n" | ForEach-Object { $_.TrimEnd() } | Where-Object { $_ -ne '' })
  $rightLines = @($rightText -split "`r?`n" | ForEach-Object { $_.TrimEnd() } | Where-Object { $_ -ne '' })
  Set-CellLines $table.Cell(1, 1) $leftLines
  Set-CellLines $table.Cell(1, 2) $rightLines

  $after = $table.Range
  $after.Collapse(0)
  $after.Select()
  $sel.TypeParagraph()
}

function Get-MarkedSections([string]$block) {
  $result = New-Object System.Collections.Generic.List[object]
  $pattern = '@@SIG_START@@|@@SIG_MID@@|@@SIG_END@@|@@SIGN_BLOCK@@|@@SIGN_MID@@|@@SIGN_END@@'
  $parts = [regex]::Split($block, "($pattern)")
  $state = 'text'
  $left = ''
  $acc = ''

  foreach ($p in $parts) {
    switch ($p) {
      '@@SIG_START@@' {
        if ($acc) { $result.Add([pscustomobject]@{Type='text'; Text=$acc}); $acc='' }
        $state = 'sig_left'; $left = ''; break
      }
      '@@SIGN_BLOCK@@' {
        if ($acc) { $result.Add([pscustomobject]@{Type='text'; Text=$acc}); $acc='' }
        $state = 'sign_left'; $left = ''; break
      }
      '@@SIG_MID@@' {
        if ($state -eq 'sig_left') { $left = $acc; $acc = ''; $state = 'sig_right' }
        elseif ($state -eq 'sign_left') { $left = $acc; $acc = ''; $state = 'sign_right' }
        break
      }
      '@@SIGN_MID@@' {
        $left = $acc; $acc = ''; $state = 'sign_right'; break
      }
      '@@SIG_END@@' {
        $result.Add([pscustomobject]@{Type='table'; Left=$left; Right=$acc})
        $acc = ''; $state = 'text'; break
      }
      '@@SIGN_END@@' {
        $result.Add([pscustomobject]@{Type='table'; Left=$left; Right=$acc})
        $acc = ''; $state = 'text'; break
      }
      default {
        if ($null -ne $p -and $p -ne '') { $acc += $p }
      }
    }
  }
  if ($acc) { $result.Add([pscustomobject]@{Type='text'; Text=$acc}) }
  return $result
}

function Write-DocumentPart($sel, $wordApp, [string]$block, [bool]$pageBreak) {
  if ($pageBreak) { [void]$sel.InsertBreak(7) }
  $sections = Get-MarkedSections $block
  foreach ($s in $sections) {
    if ($s.Type -eq 'text') {
      $lines = $s.Text -split "`r?`n"
      Write-PlainLines $sel $wordApp $lines $pageBreak
    } else {
      Add-TwoColTable $sel $s.Left $s.Right
    }
  }
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $doc = $word.Documents.Add()
  $doc.PageSetup.TopMargin = $word.CentimetersToPoints(2)
  $doc.PageSetup.BottomMargin = $word.CentimetersToPoints(2)
  $doc.PageSetup.LeftMargin = $word.CentimetersToPoints(3)
  $doc.PageSetup.RightMargin = $word.CentimetersToPoints(1.5)

  $sel = $word.Selection
  Write-DocumentPart $sel $word $main $false
  if ($appendix) { Write-DocumentPart $sel $word $appendix $true }

  $find = $doc.Content.Find
  $null = $find.Execute([char]0x2014, $false, $false, $false, $false, $false, $true, 1, $false, '-', 2)
  $null = $find.Execute([char]0x2013, $false, $false, $false, $false, $false, $true, 1, $false, '-', 2)

  if (Test-Path -LiteralPath $outPath) { Remove-Item -LiteralPath $outPath -Force }
  $fmt = 12
  $null = $doc.SaveAs([ref]$outPath, [ref]$fmt)
  $doc.Close()
  Write-Output "OK=$outPath"
}
finally {
  $word.Quit() | Out-Null
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
