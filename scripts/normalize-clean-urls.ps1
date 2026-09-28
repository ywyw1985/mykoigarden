param(
  [string]$SiteRoot = (Resolve-Path (Join-Path $PSScriptRoot ".."))
)

$ErrorActionPreference = "Stop"
$baseUrl = "https://mykoigarden.com"
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

$historyPaths = @(
  "/koi-history",
  "/zh/koi-history",
  "/es/koi-history",
  "/ja/koi-history"
)

$listingRoutes = @{
  "/local-koi-for-sale" = "/community?view=listings"
  "/zh/local-koi-for-sale" = "/zh/community?view=listings"
  "/es/local-koi-for-sale" = "/es/community?view=listings"
  "/ja/local-koi-for-sale" = "/ja/community?view=listings"
}

$changedFiles = 0
Get-ChildItem -Path $SiteRoot -Recurse -File -Filter "*.html" |
  Where-Object {
    $_.FullName -notmatch "[\\/]\.git[\\/]" -and
    $_.FullName -notmatch "[\\/]\.wrangler[\\/]"
  } |
  ForEach-Object {
    $relativePath = [System.IO.Path]::GetRelativePath($SiteRoot, $_.FullName).Replace("\", "/")
    $source = Get-Content -LiteralPath $_.FullName -Raw
    $updated = $source

    # Cloudflare Static Assets serves HTML files at extensionless public URLs.
    $updated = [regex]::Replace(
      $updated,
      '(https://mykoigarden\.com/[^"''<>\s?#]+)\.html(?=([?#"''<>\s]|$))',
      '$1',
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )
    $updated = [regex]::Replace(
      $updated,
      '((?:href|action)=["'']/[^"''?#]+)\.html(?=([?#"'']))',
      '$1',
      [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
    )

    foreach ($historyPath in $historyPaths) {
      $updated = $updated.Replace("$baseUrl$historyPath/", "$baseUrl$historyPath")
      $updated = $updated.Replace("href=`"$historyPath/`"", "href=`"$historyPath`"")
      $updated = $updated.Replace("href='$historyPath/'", "href='$historyPath'")
    }

    # Public navigation should link directly to the Worker destination rather
    # than passing visitors through a legacy listing-page redirect.
    foreach ($entry in $listingRoutes.GetEnumerator()) {
      $updated = $updated.Replace("$baseUrl$($entry.Key)", "$baseUrl$($entry.Value)")
      $updated = $updated.Replace("href=`"$($entry.Key)`"", "href=`"$($entry.Value)`"")
      $updated = $updated.Replace("href='$($entry.Key)'", "href='$($entry.Value)'")
    }

    if ($updated -ne $source) {
      [System.IO.File]::WriteAllText($_.FullName, $updated, $utf8NoBom)
      $changedFiles += 1
    }
  }

Write-Host "Normalized clean public URLs in $changedFiles HTML files."
