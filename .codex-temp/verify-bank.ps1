Add-Type -AssemblyName System.IO.Compression.FileSystem
$docx = 'c:\Users\HP\Desktop\DS1_NDA-007-26_Bizon_CMS.docx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($docx)
$entry = $zip.GetEntry('word/document.xml')
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
Write-Output ('ACC=' + $xml.Contains('40817810600082052817'))
Write-Output ('BIK=' + $xml.Contains('044525974'))
Write-Output ('KPP=' + $xml.Contains('771301001'))
Write-Output ('CORR=' + $xml.Contains('30101810145250000974'))
Write-Output ('OLD_ACC=' + $xml.Contains('40817810705971926181'))
Write-Output ('OLD_ALFA_BIK=' + $xml.Contains('044525593'))
