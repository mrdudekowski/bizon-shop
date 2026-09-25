Add-Type -AssemblyName System.IO.Compression.FileSystem
$doc = (Get-ChildItem -LiteralPath 'c:\Users\HP\Downloads\Telegram Desktop' -Filter '*.docx' |
  Where-Object { $_.Name -like '*Bizon_CMS_2.docx' } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1).FullName
$zip = [System.IO.Compression.ZipFile]::OpenRead($doc)
$sr = New-Object IO.StreamReader($zip.GetEntry('word/document.xml').Open())
$xml = $sr.ReadToEnd()
$sr.Close()
$zip.Dispose()
$tblCount = ([regex]::Matches($xml, '<w:tbl[ >]')).Count
$plain = [Net.WebUtility]::HtmlDecode(($xml -replace '</w:tr>', "`n---ROW---`n" -replace '</w:p>', "`n" -replace '<[^>]+>', ''))
$out = 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\ds1-v2-after-table.txt'
[IO.File]::WriteAllText($out, $plain, [Text.UTF8Encoding]::new($false))
Write-Output ('FILE=' + $doc)
Write-Output ('TBL=' + $tblCount)
Write-Output ('HAS_8000=' + $plain.Contains('8 000,00'))
Write-Output ('HAS_PROSE_SUFFIX=' + $plain.Contains('8 000,00 руб.'))
Write-Output ('ROWS=' + ([regex]::Matches($plain, '---ROW---')).Count)
