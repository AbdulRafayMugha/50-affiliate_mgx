# Test Coordinator Assignments
Write-Host "Testing Coordinator Assignments..." -ForegroundColor Green

# Test Hadi (should have Mike)
Write-Host "`n1. Testing Hadi (should have Mike)..." -ForegroundColor Yellow
$hadiBody = @{email = "hadi@coordinator.com"; password = "coordinator123"} | ConvertTo-Json
try {
    $hadiResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $hadiBody
    $hadiData = $hadiResponse.Content | ConvertFrom-Json
    $hadiToken = $hadiData.token
    $hadiHeaders = @{"Authorization" = "Bearer $hadiToken"; "Content-Type" = "application/json"}
    
    $hadiAffiliates = Invoke-WebRequest -Uri "http://localhost:3001/api/coordinator/affiliates" -Method GET -Headers $hadiHeaders
    $hadiAffiliatesData = $hadiAffiliates.Content | ConvertFrom-Json
    
    Write-Host "✅ Hadi's Affiliates:" -ForegroundColor Green
    foreach ($affiliate in $hadiAffiliatesData.affiliates) {
        Write-Host "  - $($affiliate.user.name) ($($affiliate.user.email))" -ForegroundColor Cyan
    }
    
    $hadiDashboard = Invoke-WebRequest -Uri "http://localhost:3001/api/coordinator/dashboard" -Method GET -Headers $hadiHeaders
    $hadiDashboardData = $hadiDashboard.Content | ConvertFrom-Json
    
    Write-Host "📊 Hadi's Dashboard Stats:" -ForegroundColor Green
    Write-Host "  - Total Affiliates: $($hadiDashboardData.stats.totalAffiliates)" -ForegroundColor White
    Write-Host "  - Active Affiliates: $($hadiDashboardData.stats.activeAffiliates)" -ForegroundColor White
    Write-Host "  - Total Commissions: $($hadiDashboardData.stats.totalCommissions)" -ForegroundColor White
    Write-Host "  - Total Referrals: $($hadiDashboardData.stats.totalReferrals)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error testing Hadi: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Nouman (should have John)
Write-Host "`n2. Testing Nouman (should have John)..." -ForegroundColor Yellow
$noumanBody = @{email = "nouman@coordinator.com"; password = "coordinator123"} | ConvertTo-Json
try {
    $noumanResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $noumanBody
    $noumanData = $noumanResponse.Content | ConvertFrom-Json
    $noumanToken = $noumanData.token
    $noumanHeaders = @{"Authorization" = "Bearer $noumanToken"; "Content-Type" = "application/json"}
    
    $noumanAffiliates = Invoke-WebRequest -Uri "http://localhost:3001/api/coordinator/affiliates" -Method GET -Headers $noumanHeaders
    $noumanAffiliatesData = $noumanAffiliates.Content | ConvertFrom-Json
    
    Write-Host "✅ Nouman's Affiliates:" -ForegroundColor Green
    foreach ($affiliate in $noumanAffiliatesData.affiliates) {
        Write-Host "  - $($affiliate.user.name) ($($affiliate.user.email))" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "❌ Error testing Nouman: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Naveed (should have Rafay)
Write-Host "`n3. Testing Naveed (should have Rafay)..." -ForegroundColor Yellow
$naveedBody = @{email = "naveed@coordinator.com"; password = "coordinator123"} | ConvertTo-Json
try {
    $naveedResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $naveedBody
    $naveedData = $naveedResponse.Content | ConvertFrom-Json
    $naveedToken = $naveedData.token
    $naveedHeaders = @{"Authorization" = "Bearer $naveedToken"; "Content-Type" = "application/json"}
    
    $naveedAffiliates = Invoke-WebRequest -Uri "http://localhost:3001/api/coordinator/affiliates" -Method GET -Headers $naveedHeaders
    $naveedAffiliatesData = $naveedAffiliates.Content | ConvertFrom-Json
    
    Write-Host "✅ Naveed's Affiliates:" -ForegroundColor Green
    foreach ($affiliate in $naveedAffiliatesData.affiliates) {
        Write-Host "  - $($affiliate.user.name) ($($affiliate.user.email))" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "❌ Error testing Naveed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Coordinator assignment test completed!" -ForegroundColor Green
