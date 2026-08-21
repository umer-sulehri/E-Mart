$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'
$results = @()

function Test-Page($name, $url, $expectStatus = 200) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20 -MaximumRedirection 0 -ErrorAction SilentlyContinue
    $status = $r.StatusCode
  } catch {
    $resp = $_.Exception.Response
    if ($resp) { $status = [int]$resp.StatusCode } else { $status = 'ERR' }
  }
  $script:results += [PSCustomObject]@{ Type='PAGE'; Name=$name; Status=$status; OK=($status -eq $expectStatus) }
}

function Test-Api($name, $method, $url, $body = $null, $session = $null, $expect = 200) {
  try {
    $params = @{ Uri = $url; Method = $method; UseBasicParsing = $true; TimeoutSec = 20; ContentType = 'application/json' }
    if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 6) }
    if ($session) { $params.WebSession = $session }
    $r = Invoke-WebRequest @params -ErrorAction Stop
    $status = $r.StatusCode
    $content = $r.Content
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $status = [int]$resp.StatusCode
      try { $content = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() } catch { $content = '' }
    } else { $status = 'ERR'; $content = $_.Exception.Message }
  }
  $snippet = ''
  if ($content) { $snippet = $content.Substring(0, [Math]::Min(160, $content.Length)) -replace '\s+', ' ' }
  $ok = ($status -eq $expect)
  $script:results += [PSCustomObject]@{ Type='API'; Name="$method $name"; Status=$status; OK=$ok; Detail=$snippet }
}

Write-Output '=== PAGES ==='
Test-Page 'Homepage' "$base/"
Test-Page 'Products list' "$base/products"
Test-Page 'Product detail' "$base/products/organic-apples-1kg"
Test-Page 'Categories' "$base/categories"
Test-Page 'Cart' "$base/cart"
Test-Page 'Checkout' "$base/checkout"
Test-Page 'Wishlist' "$base/wishlist"
Test-Page 'Blog' "$base/blog"
Test-Page 'Reviews' "$base/reviews"
Test-Page 'Login' "$base/login"
Test-Page 'Register' "$base/register"
Test-Page 'Forgot password' "$base/forgot-password"
Test-Page 'User dashboard (no auth -> redirect)' "$base/user/dashboard" 307
Test-Page 'Admin dashboard (no auth -> redirect)' "$base/admin/dashboard" 307

Write-Output '=== PUBLIC APIs ==='
Test-Api '/api/v1/products' 'GET' "$base/api/v1/products?limit=3"
Test-Api '/api/v1/products/featured?' 'GET' "$base/api/v1/products?featured=true&limit=2"
Test-Api '/api/v1/products/[slug]' 'GET' "$base/api/v1/products/organic-apples-1kg"
Test-Api '/api/v1/categories' 'GET' "$base/api/v1/categories"
Test-Api '/api/v1/products/search' 'GET' "$base/api/v1/products/search?q=apple"
Test-Api '/api/v1/search/suggestions' 'GET' "$base/api/v1/search/suggestions?q=app"
Test-Api '/api/v1/social-links' 'GET' "$base/api/v1/social-links"

Write-Output '=== AUTH FLOW ==='
# login with bad creds -> expect 401
Test-Api 'auth/login (bad creds)' 'POST' "$base/api/v1/auth/login" @{ email = 'nobody@test.com'; password = 'wrong123' } $null 401
# otp request for register flow
Test-Api 'auth/otp/request' 'POST' "$base/api/v1/auth/otp/request" @{ identifier = 'flowtest@e-mart.test' }

$results | Format-Table Type, Name, Status, OK, Detail -AutoSize -Wrap
