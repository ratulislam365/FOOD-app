# PowerShell script to test proximity search API
# Run: .\test-proximity-search.ps1

$API_BASE_URL = "http://localhost:5000/api/v1"

Write-Host "`n🚀 Testing Proximity Search API" -ForegroundColor Green
Write-Host "=" * 50

# Test 1: Basic search in New York
Write-Host "`n📍 Test 1: Find providers near New York City" -ForegroundColor Cyan

$body = @{
    latitude = 40.7128
    longitude = -74.0060
    radius = 3
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$API_BASE_URL/provider/nearby" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "✅ Found $($response.data.Count) providers" -ForegroundColor Green
Write-Host "Message: $($response.message)"

if ($response.data.Count -gt 0) {
    Write-Host "`n🏪 Top 3 Nearest Providers:" -ForegroundColor Yellow
    $response.data | Select-Object -First 3 | ForEach-Object {
        Write-Host "`n  • $($_.restaurantName)" -ForegroundColor White
        Write-Host "    Distance: $($_.distance) km"
        Write-Host "    Cuisine: $($_.cuisine -join ', ')"
        Write-Host "    Address: $($_.restaurantAddress), $($_.city), $($_.state)"
        Write-Host "    Phone: $($_.phoneNumber)"
    }
}

# Test 2: Search with cuisine filter
Write-Host "`n`n📍 Test 2: Find Italian restaurants within 5km" -ForegroundColor Cyan

$body = @{
    latitude = 40.7128
    longitude = -74.0060
    radius = 5
    cuisine = "Italian"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/provider/nearby" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "✅ Found $($response.data.Count) Italian restaurants" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Search with pagination
Write-Host "`n`n📍 Test 3: Pagination test (Page 1, Limit 5)" -ForegroundColor Cyan

$body = @{
    latitude = 40.7128
    longitude = -74.0060
    radius = 10
    page = 1
    limit = 5
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$API_BASE_URL/provider/nearby" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

Write-Host "✅ Page $($response.pagination.page) of $($response.pagination.totalPages)" -ForegroundColor Green
Write-Host "Total providers: $($response.pagination.total)"

# Test 4: Invalid coordinates
Write-Host "`n`n📍 Test 4: Invalid coordinates (should fail)" -ForegroundColor Cyan

$body = @{
    latitude = 100
    longitude = -74.0060
    radius = 3
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/provider/nearby" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "❌ Should have failed but didn't" -ForegroundColor Red
} catch {
    Write-Host "✅ Correctly rejected invalid input" -ForegroundColor Green
    Write-Host "Error: $($_.Exception.Message)"
}

# Test 5: Different radii comparison
Write-Host "`n`n📍 Test 5: Compare different search radii" -ForegroundColor Cyan

$radii = @(1, 3, 5, 10)

foreach ($radius in $radii) {
    $body = @{
        latitude = 40.7128
        longitude = -74.0060
        radius = $radius
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/provider/nearby" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "  Radius ${radius}km: $($response.data.Count) providers found"
}

Write-Host "`n`n✅ All tests completed!" -ForegroundColor Green
Write-Host "=" * 50
