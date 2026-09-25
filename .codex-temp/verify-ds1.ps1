Add-Type -AssemblyName System.IO.Compression.FileSystem
$docx = 'c:\Users\HP\Desktop\DS1_NDA-007-26_Bizon_CMS.docx'
$out = 'c:\Users\HP\Documents\Cursor projects\Commersial\Bizon\.codex-temp\ds1-verify.txt'
$zip = [System.IO.Compression.ZipFile]::OpenRead($docx)
$entry = $zip.GetEntry('word/document.xml')
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
$plain = $xml -replace '</w:p>', "`n"
$plain = $plain -replace '<[^>]+>', ''
$plain = [System.Net.WebUtility]::HtmlDecode($plain)
$lines = $plain -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
[System.IO.File]::WriteAllText($out, ($lines -join "`n"), [System.Text.UTF8Encoding]::new($false))
Write-Output ('LINES=' + $lines.Count)
Write-Output ('SIZE=' + (Get-Item $docx).Length)
Write-Output ('EM=' + $xml.Contains([char]0x2014))
Write-Output ('ACC=' + $xml.Contains('40817810600082052817'))
Write-Output ('TOTAL=' + $plain.Contains('302 500'))
Write-Output ('CMS=' + $plain.Contains('Bizon CMS'))
Write-Output ('FIRST3=')
$lines | Select-Object -First 3 | ForEach-Object { Write-Output $_ }
