param([string]$Source)
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead($Source)
$reader = [IO.StreamReader]::new($archive.GetEntry('word/document.xml').Open())
[xml]$document = $reader.ReadToEnd()
$reader.Close()
$archive.Dispose()
$ns = [Xml.XmlNamespaceManager]::new($document.NameTable)
$ns.AddNamespace('w','http://schemas.openxmlformats.org/wordprocessingml/2006/main')
function Read-Paragraph($node) {
  return ($node.SelectNodes('.//w:t | .//w:br | .//w:cr | .//w:tab',$ns) | ForEach-Object {
    $part = $_
    switch ($part.LocalName) {
      't' { $part.InnerText }
      'tab' { "`t" }
      default { "`n" }
    }
  }) -join ''
}
$sections = [Collections.Generic.List[object]]::new()
$blocks = [Collections.Generic.List[object]]::new()
$current = $null
foreach ($node in $document.SelectNodes('//w:body/*',$ns)) {
  if ($node.LocalName -eq 'p') {
    $value = Read-Paragraph $node
    if ($value -match '^(\d{2})\s+(.+)$') {
      $current = @{ code=$Matches[1]; title=$Matches[2]; blocks=[Collections.Generic.List[object]]::new() }
      $sections.Add($current)
    } elseif ($value.Trim()) {
      $block = @{kind='paragraph'; text=$value}
      if ($null -eq $current) { $blocks.Add($block) } else { $current.blocks.Add($block) }
    }
  } elseif ($node.LocalName -eq 'tbl') {
    $rows = @($node.SelectNodes('./w:tr',$ns) | ForEach-Object {
      $cells = @($_.SelectNodes('./w:tc',$ns) | ForEach-Object {
        ($_.SelectNodes('./w:p',$ns) | ForEach-Object { Read-Paragraph $_ }) -join "`n"
      })
      ,$cells
    })
    $block = @{kind='table'; rows=$rows}
    if ($null -eq $current) { $blocks.Add($block) } else { $current.blocks.Add($block) }
  }
}
@{source=[IO.Path]::GetFileName($Source); preamble=@($blocks); dimensions=@($sections)} | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath 'src/data/sdx-institutional-source.json' -Encoding utf8
