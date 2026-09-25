Add-Type -AssemblyName System.IO.Compression.FileSystem

function Extract-Docx([string]$path, [string]$outPath) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
  $entry = $zip.GetEntry('word/document.xml')
  $reader = New-Object System.IO.StreamReader($entry.Open())
  $xml = $reader.ReadToEnd()
  $reader.Close()
  $zip.Dispose()
  $xml = $xml -replace '</w:p>', "`n"
  $xml = $xml -replace '<w:tab[^/]*/>', "`t"
  $xml = $xml -replace '<[^>]+>', ''
  $xml = [System.Net.WebUtility]::HtmlDecode($xml)
  $lines = $xml -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
  [System.IO.File]::WriteAllText($outPath, ($lines -join "`n"), [System.Text.UTF8Encoding]::new($false))
  Write-Output ("OK " + $lines.Count + " -> " + $outPath)
}

$outDir = 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp'

Write-Output '=== DESKTOP DOCX ==='
Get-ChildItem -LiteralPath 'c:\Users\HP\Desktop' -Filter '*.docx' |
  ForEach-Object { Write-Output ($_.Name + '|' + $_.Length + '|' + $_.LastWriteTime.ToString('s')) }

Write-Output '=== TELEGRAM DOCX ==='
$tplDir = 'c:\Users\HP\Downloads\Telegram Desktop'
Get-ChildItem -LiteralPath $tplDir -Filter '*.docx' -ErrorAction SilentlyContinue |
  ForEach-Object { Write-Output ($_.Name + '|' + $_.Length + '|' + $_.LastWriteTime.ToString('s')) }

$current = Get-ChildItem -LiteralPath 'c:\Users\HP\Desktop' -Filter '*.docx' |
  Where-Object { $_.Name -like '*Bizon_CMS*' } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

# Template: filename starts with Forma_ or contains Form
$template = Get-ChildItem -LiteralPath $tplDir -Filter '*.docx' -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like 'Forma_*' -or $_.Name -like 'Form_*' -or $_.Name -like '*Forma*' } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $template) {
  # pick newest docx in Telegram Desktop whose name length suggests the long Russian form title
  $template = Get-ChildItem -LiteralPath $tplDir -Filter '*.docx' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name.Length -ge 35 } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

if ($current) {
  Write-Output ('CURRENT=' + $current.FullName)
  Extract-Docx $current.FullName (Join-Path $outDir 'ds1-current.txt')
} else {
  Write-Output 'CURRENT_NOT_FOUND'
}

if ($template) {
  Write-Output ('TEMPLATE=' + $template.FullName)
  Extract-Docx $template.FullName (Join-Path $outDir 'ds1-template-form.txt')
} else {
  Write-Output 'TEMPLATE_NOT_FOUND'
}
