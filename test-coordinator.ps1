# Test Coordinator Access Script
Write-Host "Testing Coordinator Access..." -ForegroundColor Green

# Step 1: Login as Coordinator
Write-Host "`n1. Logging in as Hadi (Coordinator)..." -ForegroundColor Yellow

$loginBody = @{
    email = "hadi@coordinator.com"
    password = "coordinator123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "User: $($loginData.user.name) ($($loginData.user.role))" -ForegroundColor Cyan
    Write-Host "Referral Code: $($loginData.user.referral_code)" -ForegroundColor Cyan
    
    $token = $loginData.token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Step 2: Access Coordinator Dashboard
    Write-Host "`n2. Accessing Coordinator Dashboard..." -ForegroundColor Yellow
    
    $dashboardResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/coordinator/dashboard" -Method GET -Headers $headers
    $dashboardData = $dashboardResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Dashboard accessed successfully!" -ForegroundColor Green
    Write-Host "Dashboard Stats:" -ForegroundColor Cyan
    Write-Host "  - Total Affiliates: $($dashboardData.stats.totalAffiliates)" -ForegroundColor White
    Write-Host "  - Active Affiliates: $($dashboardData.stats.activeAffiliates)" -ForegroundColor White
    Write-Host "  - Total Commissions: $($dashboardData.stats.totalCommissions)" -ForegroundColor White
    Write-Host "  - Pending Commissions: $($dashboardData.stats.pendingCommissions)" -ForegroundColor White
    Write-Host "  - Total Referrals: $($dashboardData.stats.totalReferrals)" -ForegroundColor White
    
    # Step 3: Get Referral Key
    Write-Host "`n3. Getting Referral Key..." -ForegroundColor Yellow
    
    $referralResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/coordinator/referral-key" -Method GET -Headers $headers
    $referralData = $referralResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Referral Key retrieved!" -ForegroundColor Green
    Write-Host "Referral Code: $($referralData.referralCode)" -ForegroundColor Cyan
    
    # Step 4: List Affiliates (will be empty initially)
    Write-Host "`n4. Listing Assigned Affiliates..." -ForegroundColor Yellow
    
    $affiliatesResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/coordinator/affiliates" -Method GET -Headers $headers
    $affiliatesData = $affiliatesResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ Affiliates list retrieved!" -ForegroundColor Green
    Write-Host "Total Affiliates Assigned: $($affiliatesData.total)" -ForegroundColor White
    
    if ($affiliatesData.affiliates.Count -gt 0) {
        Write-Host "Assigned Affiliates:" -ForegroundColor Cyan
        foreach ($affiliate in $affiliatesData.affiliates) {
            Write-Host "  - $($affiliate.user.name) ($($affiliate.user.email))" -ForegroundColor White
        }
    } else {
        Write-Host "No affiliates assigned yet. Admin can assign affiliates to this coordinator." -ForegroundColor Yellow
    }
    
    Write-Host "`n🎉 Coordinator access test completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorContent = $reader.ReadToEnd()
        Write-Host "Response: $errorContent" -ForegroundColor Red
    }
}
