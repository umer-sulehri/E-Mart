$ErrorActionPreference = "Stop"
$base = (Resolve-Path "app\api\v1").Path
$out = Join-Path (Resolve-Path ".").Path "docs\API_REFERENCE.md"

$groupDesc = @{
  "admin"        = "Administrator operations (auth: admin role)."
  "auth"         = "Authentication and account management."
  "addresses"    = "Buyer shipping addresses."
  "banners"      = "Homepage hero banners (public GET, admin CRUD)."
  "blog-posts"   = "Blog articles (public GET, admin/seller CRUD)."
  "cart"         = "Buyer cart (server-backed, keyed by user)."
  "categories"   = "Product taxonomy."
  "contact"      = "Public contact form."
  "coupons"      = "Discount coupons."
  "newsletter"   = "Newsletter subscriptions."
  "notifications" = "In-app + email/SMS notifications."
  "orders"       = "Buyer orders and lifecycle actions."
  "payments"     = "Payment providers (Easypaisa, JazzCash, Stripe, COD)."
  "products"     = "Product catalog and merchandising."
  "reviews"      = "Product reviews."
  "search"       = "Search, autocomplete, trending, voice."
  "seller"       = "Seller dashboard operations (auth: seller/vendor)."
  "sellers"      = "Public storefront data."
  "settings"     = "Store settings (general, layout, payments, seo)."
  "social-links" = "Public social links."
  "uploads"      = "File/image uploads."
  "wishlist"     = "Buyer wishlist."
}

$hint = @{
  "GET products/[slug]/stock" = "Live stock level for a product"
  "GET products/[slug]/views" = "Increment/return view count"
}

$files = Get-ChildItem -Recurse -File -Path $base -Filter "route.ts"
$sb = New-Object System.Text.StringBuilder

[void]$sb.AppendLine('# E-Mart API Reference')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('Auto-generated from the Next.js App Router route handlers under `app/api/v1`.')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('Base path: `/api/v1`. All handlers return JSON.')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('## Response envelope')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('| Field | Type | Description |')
[void]$sb.AppendLine('|-------|------|-------------|')
[void]$sb.AppendLine('| `success` | `boolean` | Whether the request succeeded |')
[void]$sb.AppendLine('| `data` | `any` | Payload on success (list/detail/created record) |')
[void]$sb.AppendLine('| `error` | `string` | Message on failure (or `none` when no data field) |')
[void]$sb.AppendLine('| `meta` | `object` | Pagination: `currentPage`, `totalPages`, `totalItems`, `itemsPerPage`, `hasNextPage`, `hasPreviousPage` |')
[void]$sb.AppendLine('| `summary` | `object[]` | Aggregates where applicable (e.g. orders) |')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('## Auth')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('- Public routes need no session (e.g. `products`, `blog-posts`, `sellers`, `banners`, `reviews` GET).')
[void]$sb.AppendLine('- Buyer routes require a logged-in **buyer** session (e.g. `cart`, `orders`, `wishlist`, `addresses`).')
[void]$sb.AppendLine('- Seller routes require a **seller** session and verified vendor (e.g. `seller/*`).')
[void]$sb.AppendLine('- Admin routes require the **admin** role (e.g. `admin/*`).')
[void]$sb.AppendLine('- Session is resolved server-side via Supabase cookies; endpoints return `401` when missing.')
[void]$sb.AppendLine('')

$lastRoot = ""
foreach ($f in $files) {
  $path = $f.FullName.Substring($base.Length).TrimStart('\').Replace('route.ts', '').TrimEnd('\')
  $seg = $path.Replace('\', '/')
  $methods = [System.Text.RegularExpressions.Regex]::Matches((Get-Content -LiteralPath $f.FullName -Raw), 'export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b') | ForEach-Object { $_.Groups[2].Value } | Sort-Object -Unique
  $root = $seg.Split('/')[0]
  if ($root -ne $lastRoot) {
    if ($lastRoot -ne "") { [void]$sb.AppendLine("") }
    $desc = if ($groupDesc.ContainsKey($root)) { $groupDesc[$root] } else { 'Endpoints in the ' + $root + ' group.' }
    [void]$sb.AppendLine("## /$root")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("$desc")
    [void]$sb.AppendLine("")
    [void]$sb.AppendLine("| Method(s) | Endpoint |")
    [void]$sb.AppendLine("|-----------|----------|")
    $lastRoot = $root
  }
  [void]$sb.AppendLine(("| " + ($methods -join ', ') + " | `/api/v1/" + $seg + "` |").Replace('`', ''))
}

Set-Content -LiteralPath $out -Value $sb.ToString() -Encoding UTF8
Write-Output "Wrote $((Get-Content -LiteralPath $out).Count) lines to $out"