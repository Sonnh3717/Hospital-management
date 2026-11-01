[xml]$xml = Get-Content 'docs/srs_unzip/word/document.xml'
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

$sb = New-Object System.Text.StringBuilder

# Find all paragraphs and table rows/cells in order
$bodyNodes = $xml.SelectNodes("//w:body/*", $ns)
foreach ($node in $bodyNodes) {
    if ($node.LocalName -eq "p") {
        $text = $node.InnerText
        if (![string]::IsNullOrWhiteSpace($text)) {
            [void]$sb.AppendLine($text)
        }
    } elseif ($node.LocalName -eq "tbl") {
        [void]$sb.AppendLine("--- TABLE START ---")
        $rows = $node.SelectNodes(".//w:tr", $ns)
        foreach ($row in $rows) {
            $cells = $row.SelectNodes(".//w:tc", $ns)
            $cellTexts = @()
            foreach ($cell in $cells) {
                $cellTexts += ($cell.InnerText -replace '\s+', ' ').Trim()
            }
            [void]$sb.AppendLine(($cellTexts -join " | "))
        }
        [void]$sb.AppendLine("--- TABLE END ---`n")
    }
}

[System.IO.File]::WriteAllText('docs/srs_full_text.txt', $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "Extracted full text with tables to docs/srs_full_text.txt"

