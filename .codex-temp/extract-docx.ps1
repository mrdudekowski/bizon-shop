Add-Type -AssemblyName System.IO.Compression.FileSystem
$doc = Get-ChildItem -LiteralPath 'c:\Users\HP\Desktop' -Filter '*.docx' |
  Where-Object { $_.Name -like '*007*' } |
  Select-Object -First 1
if (-not $doc) { throw 'DOCX with 007 not found on Desktop' }
$outDir = 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp'
$outPath = Join-Path $outDir 'contract-etalon.txt'
$zip = [System.IO.Compression.ZipFile]::OpenRead($doc.FullName)
$entry = $zip.GetEntry('word/document.xml')
$sr = New-Object System.IO.StreamReader($entry.Open())
$xml = $sr.ReadToEnd()
$sr.Close()
$zip.Dispose()
$xml = $xml -replace '</w:p>', "`n"
$xml = $xml -replace '<w:tab[^/]*/>', "`t"
$xml = $xml -replace '<[^>]+>', ''
$xml = [System.Net.WebUtility]::HtmlDecode($xml)
$lines = $xml -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
[System.IO.File]::WriteAllText($outPath, ($lines -join "`n"), [System.Text.UTF8Encoding]::new($false))
Write-Output ("SOURCE=" + $doc.FullName)
Write-Output ("LINES=" + $lines.Count)
Write-Output ("OUT=" + $outPath)
