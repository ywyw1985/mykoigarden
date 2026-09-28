param(
  [string]$SiteRoot = (Resolve-Path (Join-Path $PSScriptRoot ".."))
)

$ErrorActionPreference = "Stop"
$baseUrl = "https://mykoigarden.com"
$redirectOnlyUrls = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
@(
  "$baseUrl/local-koi-for-sale.html",
  "$baseUrl/local-koi-for-sale",
  "$baseUrl/zh/local-koi-for-sale.html",
  "$baseUrl/zh/local-koi-for-sale",
  "$baseUrl/es/local-koi-for-sale.html",
  "$baseUrl/es/local-koi-for-sale",
  "$baseUrl/ja/local-koi-for-sale.html"
  "$baseUrl/ja/local-koi-for-sale",
  "$baseUrl/koi/",
  "$baseUrl/koi-history/",
  "$baseUrl/zh/koi-history/",
  "$baseUrl/es/koi-history/",
  "$baseUrl/ja/koi-history/"
) | ForEach-Object { [void]$redirectOnlyUrls.Add($_) }

Push-Location $SiteRoot
try {
  $candidates = Get-ChildItem -Path $SiteRoot -Recurse -File -Filter "*.html" |
    Where-Object {
      $_.FullName -notmatch "[\\/]\.git[\\/]" -and
      $_.FullName -notmatch "[\\/]\.wrangler[\\/]" -and
      $_.FullName -notmatch "[\\/]admin[\\/]"
    } |
    ForEach-Object {
      $relativePath = [System.IO.Path]::GetRelativePath($SiteRoot, $_.FullName).Replace("\", "/")
      if ($relativePath.EndsWith("local-koi-for-sale.html")) { return }
      $html = Get-Content -LiteralPath $_.FullName -Raw
      $match = [regex]::Match($html, '<link\s+rel="canonical"\s+href="(https://mykoigarden\.com/[^"]*)"')
      if (-not $match.Success) { return }
      if ($redirectOnlyUrls.Contains($match.Groups[1].Value)) { return }

      $expectedPath = if ($relativePath -eq "index.html") {
        "/"
      } elseif ($relativePath.EndsWith("/index.html")) {
        "/" + $relativePath.Substring(0, $relativePath.Length - "index.html".Length)
      } elseif ($relativePath.EndsWith(".html")) {
        "/" + $relativePath.Substring(0, $relativePath.Length - ".html".Length)
      } else {
        "/" + $relativePath
      }

      [pscustomobject]@{
        Url = $match.Groups[1].Value
        RelativePath = $relativePath
        IsCanonicalFile = ($match.Groups[1].Value -eq ($baseUrl + $expectedPath))
      }
    }

  $pages = $candidates |
    Group-Object Url |
    ForEach-Object {
      $_.Group | Sort-Object @{ Expression = "IsCanonicalFile"; Descending = $true }, RelativePath | Select-Object -First 1
    } |
    Sort-Object @{ Expression = { if ($_.Url -eq "$baseUrl/") { "" } else { $_.Url } } }

  $lines = [System.Collections.Generic.List[string]]::new()
  $lines.Add('<?xml version="1.0" encoding="UTF-8"?>')
  $lines.Add('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

  foreach ($page in $pages) {
    $workingTreeStatus = git status --porcelain -- $page.RelativePath
    $lastModified = if ($workingTreeStatus) {
      Get-Date -Format "yyyy-MM-dd"
    } else {
      git log -1 --format=%cs -- $page.RelativePath
    }
    if (-not $lastModified) {
      throw "No Git modification date found for $($page.RelativePath)"
    }

    $escapedUrl = [System.Security.SecurityElement]::Escape($page.Url)
    $lines.Add("  <url>")
    $lines.Add("    <loc>$escapedUrl</loc>")
    $lines.Add("    <lastmod>$lastModified</lastmod>")
    $lines.Add("  </url>")
  }

  $lines.Add('</urlset>')
  $content = ($lines -join "`n") + "`n"
  [System.IO.File]::WriteAllText((Join-Path $SiteRoot "sitemap.xml"), $content, [System.Text.UTF8Encoding]::new($false))
  Write-Host "Updated sitemap.xml with $($pages.Count) canonical URLs."
}
finally {
  Pop-Location
}
