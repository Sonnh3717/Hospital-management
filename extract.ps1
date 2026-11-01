Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead('docs/SRS.docx')
$entry = $zip.GetEntry('word/document.xml')
$reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
$xmlText = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()

$xml = [xml]$xmlText
$sb = New-Object System.Text.StringBuilder
foreach ($p in $xml.document.body.p) {
    $t = $p.InnerText
    if (![string]::IsNullOrWhiteSpace($t)) {
        [void]$sb.AppendLine($t)
    }
}
[System.IO.File]::WriteAllText('docs/srs_text.txt', $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Done extracting SRS text"

