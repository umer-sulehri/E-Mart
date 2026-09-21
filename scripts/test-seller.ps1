param(
  [string]$Role = "seller",
  [string]$Email = "seller.organic@emart.com",
  [string]$Password = "SellerOrganic@2025#",
  [string]$Base = "http://localhost:3001"
)

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = @{ email = $Email; password = $Password; role = $Role } | ConvertTo-Json
$r = Invoke-WebRequest -Uri "$Base/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json" -WebSession $session -UseBasicParsing -TimeoutSec 40
Write-Output "LOGIN: $($r.StatusCode)"

function Show([string]$label, $session2, [string]$method = "GET", [string]$url, $body2 = $null) {
  try {
    $params = @{ Uri = $url; Method = $method; WebSession = $session2; UseBasicParsing = $true; TimeoutSec = 40; ErrorAction = "Stop" }
    if ($null -ne $body2) { $params.Body = ($body2 | ConvertTo-Json -Depth 6); $params.ContentType = "application/json" }
    $resp = Invoke-WebRequest @params
    $c = $resp.Content
    $head = $c.Substring(0, [Math]::Min(330, $c.Length))
    Write-Output "=== [$label] $method $url => $($resp.StatusCode)"
    Write-Output $head
  } catch {
    $er = $_.Exception.Response
    if ($er) {
      $reader = New-Object System.IO.StreamReader($er.GetResponseStream())
      $b = $reader.ReadToEnd()
      Write-Output "=== [$label] $method $url => $([int]$er.StatusCode) [CT:$($er.ContentType)]"
      Write-Output $b.Substring(0, [Math]::Min(330, $b.Length))
    } else { Write-Output "=== [$label] $method $url ERR $($_.Exception.Message)" }
  }
}

# Seller dashboard endpoints
Show "seller-products" $session GET "$Base/api/v1/seller/products?limit=5"
Show "seller-earnings" $session GET "$Base/api/v1/seller/earnings"
Show "seller-trend" $session GET "$Base/api/v1/seller/earnings/trend"
Show "seller-orders" $session GET "$Base/api/v1/seller/orders?limit=5"
Show "seller-payout-method GET" $session GET "$Base/api/v1/seller/payout/method"
Show "seller-payout" $session GET "$Base/api/v1/seller/payout"
Show "seller-reviews" $session GET "$Base/api/v1/seller/reviews?page=1&limit=10"
Show "seller-coupons" $session GET "$Base/api/v1/seller/coupons"

# Payout method PATCH test (bank)
Show "payout-method PATCH" $session PATCH "$Base/api/v1/seller/payout/method" @{ preferred_method = "bank"; bank_name = "Meezan Bank"; account_title = "Ayesha Organic Farms"; account_number = "PK36MEZN0000"; iban = ""; easypaisa_phone = ""; jazzcash_phone = "" }
Show "seller-payout-method GET after PATCH" $session GET "$Base/api/v1/seller/payout/method"

# Payout request (small, will test validation first - expect insufficient or success)
Show "payout-request" $session POST "$Base/api/v1/seller/payout/request" @{ amount = 100; method = "bank"; account_details = @{ value = "PK36MEZN0000123456789010" } }

# Review write (as buyer would) - test auth/reviews GET
Show "buyer-reviews-auth" $session GET "$Base/api/v1/auth/reviews?status=approved"

Write-Output "`nDone."