$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'
$restKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZ214aXh0dWliaG5xYmZveWZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzI4OTEwOSwiZXhwIjoyMTAyODY1MTA5fQ.LeEnkvOou7KKh5x5XiZx7OEJPtowq4W63JdCJ89abWk'
$restHdr = @{ apikey = $restKey; Authorization = "Bearer $restKey" }
$stamp = Get-Date -Format 'HHmmss'
$email = "flow$stamp@e-mart.test"
$password = 'FlowTest123'

function Log($name, $status, $ok, $detail = '') {
  $color = if ($ok) { 'Green' } else { 'Red' }
  Write-Host ("[{0}] {1} -> {2} {3}" -f ($(if ($ok) {'PASS'} else {'FAIL'})), $name, $status, $detail) -ForegroundColor $color
}

function Invoke-Json($method, $url, $body = $null, $session = $null) {
  $params = @{ Uri = $url; Method = $method; UseBasicParsing = $true; TimeoutSec = 25; ContentType = 'application/json' }
  if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 8) }
  if ($session) { $params.WebSession = $session }
  try {
    $r = Invoke-WebRequest @params -ErrorAction Stop
    return @{ status = $r.StatusCode; body = ($r.Content | ConvertFrom-Json); raw = $r.Content }
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $txt = ''
      try { $txt = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() } catch {}
      return @{ status = [int]$resp.StatusCode; body = $null; raw = $txt }
    }
    return @{ status = -1; body = $null; raw = $_.Exception.Message }
  }
}

# ── 0. grab a product id ─────────────────────────────────────────────────────
$prodRes = Invoke-Json 'GET' "$base/api/v1/products?limit=1"
$productId = $prodRes.body.products[0].id
Log 'fetch product for flows' $prodRes.status ($productId -ne $null) $productId

# ── 1. REGISTER FLOW ─────────────────────────────────────────────────────────
$r1 = Invoke-Json 'POST' "$base/api/v1/auth/otp/request" @{ identifier = $email }
Log 'register: otp request' $r1.status ($r1.status -eq 200) $r1.raw

$sess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$r2 = Invoke-Json 'POST' "$base/api/v1/auth/otp/verify" @{
  identifier = $email; code = '123456'; purpose = 'register'
  name = 'Flow Tester'; userType = 'customer'; password = $password; phone = '+923001234567'
} $sess
Log 'register: otp verify (creates account + session)' $r2.status ($r2.status -eq 200) $r2.raw

$r3 = Invoke-Json 'GET' "$base/api/v1/auth/me" $null $sess
$meOk = ($r3.status -eq 200 -and $r3.body.user -and $r3.body.user.email -eq $email)
Log 'register: auth/me with session cookie' $r3.status $meOk $r3.raw

# duplicate registration should 409
$sessDup = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-Json 'POST' "$base/api/v1/auth/otp/request" @{ identifier = $email } | Out-Null
$rDup = Invoke-Json 'POST' "$base/api/v1/auth/otp/verify" @{
  identifier = $email; code = '123456'; purpose = 'register'; name = 'Dup'; password = $password
} $sessDup
Log 'register: duplicate email rejected (409)' $rDup.status ($rDup.status -eq 409) $rDup.raw

# ── 2. LOGIN FLOW ────────────────────────────────────────────────────────────
$loginSess = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$l1 = Invoke-Json 'POST' "$base/api/v1/auth/login" @{ email = $email; password = 'WrongPass1' } $loginSess
Log 'login: wrong password -> 401' $l1.status ($l1.status -eq 401) $l1.raw

$l2 = Invoke-Json 'POST' "$base/api/v1/auth/login" @{ email = $email; password = $password } $loginSess
Log 'login: correct credentials' $l2.status ($l2.status -eq 200) $l2.raw

$l3 = Invoke-Json 'GET' "$base/api/v1/auth/me" $null $loginSess
$meOk2 = ($l3.status -eq 200 -and $l3.body.user -and $l3.body.user.email -eq $email)
Log 'login: auth/me' $l3.status $meOk2 $l3.raw

# ── 3. CART FLOW ─────────────────────────────────────────────────────────────
$c0 = Invoke-Json 'GET' "$base/api/v1/cart/items"
Log 'cart: unauthenticated -> 401' $c0.status ($c0.status -eq 401) $c0.raw

$c1 = Invoke-Json 'POST' "$base/api/v1/cart/items" @{ productId = $productId; quantity = 2 } $loginSess
Log 'cart: add item' $c1.status ($c1.status -eq 201) $c1.raw

$c2 = Invoke-Json 'GET' "$base/api/v1/cart/items" $null $loginSess
$cartOk = ($c2.status -eq 200 -and $c2.body.items.Count -ge 1)
Log 'cart: list items' $c2.status $cartOk ("total=" + $c2.body.total)

# ── 4. WISHLIST FLOW ─────────────────────────────────────────────────────────
$w1 = Invoke-Json 'POST' "$base/api/v1/wishlist" @{ productId = $productId } $loginSess
Log 'wishlist: add' $w1.status ($w1.status -eq 200 -or $w1.status -eq 201) $w1.raw

$w2 = Invoke-Json 'GET' "$base/api/v1/wishlist" $null $loginSess
$wlOk = ($w2.status -eq 200)
Log 'wishlist: list' $w2.status $wlOk $w2.raw

# ── 5. ORDER / CHECKOUT FLOW ─────────────────────────────────────────────────
$o1 = Invoke-Json 'POST' "$base/api/v1/orders" @{
  items = @(@{ productId = $productId; productName = 'Test Product'; productImage = ''; price = 350; quantity = 2 })
  address = 'House 12, Street 5, Karachi, Pakistan'
  paymentMethod = 'cod'
} $loginSess
Log 'orders: create COD order' $o1.status ($o1.status -eq 200 -or $o1.status -eq 201) $o1.raw

$o2 = Invoke-Json 'GET' "$base/api/v1/orders" $null $loginSess
$ordOk = ($o2.status -eq 200)
Log 'orders: list my orders' $o2.status $ordOk $o2.raw

# ── 6. PROFILE UPDATE ────────────────────────────────────────────────────────
$p1 = Invoke-Json 'PATCH' "$base/api/v1/auth/profile" @{ name = 'Flow Tester Updated' } $loginSess
Log 'auth: update profile' $p1.status ($p1.status -eq 200) $p1.raw

# ── cleanup: delete test user ────────────────────────────────────────────────
try {
  $prof = Invoke-RestMethod -Uri "https://ufgmxixtuibhnqbfoyfq.supabase.co/rest/v1/profiles?email=eq.$email&select=id" -Headers $restHdr
  if ($prof.Count -gt 0) {
    Invoke-RestMethod -Method Delete -Uri "https://ufgmxixtuibhnqbfoyfq.supabase.co/auth/v1/admin/users/$($prof[0].id)" -Headers $restHdr | Out-Null
    Write-Host "[CLEANUP] removed test user $email" -ForegroundColor Cyan
  }
} catch { Write-Host "[CLEANUP] failed: $($_.Exception.Message)" -ForegroundColor Yellow }
