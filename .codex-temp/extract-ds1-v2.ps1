Add-Type -AssemblyName System.IO.Compression.FileSystem
$tplDir = 'c:\Users\HP\Downloads\Telegram Desktop'
$doc = Get-ChildItem -LiteralPath $tplDir -Filter '*.docx' |
  Where-Object { $_.Name -like '*Bizon_CMS_2*' -or $_.Name -like '*CMS_2*' } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
if (-not $doc) {
  $doc = Get-ChildItem -LiteralPath $tplDir -Filter '*.docx' |
    Where-Object { $_.Name -like '*007*26*Bizon*' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}
Write-Output ('SRC=' + $doc.FullName)
$zip = [System.IO.Compression.ZipFile]::OpenRead($doc.FullName)
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
$out = 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\ds1-v2-source.txt'
[System.IO.File]::WriteAllText($out, ($lines -join "`n"), [System.Text.UTF8Encoding]::new($false))
Write-Output ('LINES=' + $lines.Count)
Write-Output ('OUT=' + $out)
