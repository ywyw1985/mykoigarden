param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[0-9]{8}[a-z]$')]
  [string]$Version,
  [string]$SiteRoot = (Resolve-Path (Join-Path $PSScriptRoot ".."))
)

$ErrorActionPreference = "Stop"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$changedFiles = 0

Get-ChildItem -Path $SiteRoot -Recurse -File -Filter "*.html" |
  Where-Object {
    $_.FullName -notmatch "[\\/]\.git[\\/]" -and
    $_.FullName -notmatch "[\\/]\.wrangler[\\/]"
  } |
  ForEach-Object {
    $source = Get-Content -LiteralPath $_.FullName -Raw
    $updated = [regex]::Replace(
      $source,
      '((?:href)=["''])(?:/)?styles\.css(?:\?v=[^"'']*)?',
      "`$1/styles.css?v=$Version",
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
    $updated = [regex]::Replace(
      $updated,
      '((?:src)=["''])(?:/)?app\.js(?:\?v=[^"'']*)?',
      "`$1/app.js?v=$Version",
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    if ($updated -ne $source) {
      [System.IO.File]::WriteAllText($_.FullName, $updated, $utf8NoBom)
      $changedFiles += 1
    }
  }

Write-Host "Set shared CSS and JavaScript asset version to $Version in $changedFiles HTML files."
