# Test OAuth Endpoints with PowerShell
# This tests if the endpoints are registered correctly

Write-Host "`n🧪 Testing OAuth Endpoints...`n" -ForegroundColor Cyan

# Test 1: Google OAuth endpoint
Write-Host "Test 1: POST /api/auth/google" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/google" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"idToken":"test-token","requestedRole":"CUSTOMER"}' `
        -ErrorAction SilentlyContinue
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode" -ForegroundColor $(if ($statusCode -eq 404) { "Red" } else { "Green" })
    
    if ($statusCode -eq 404) {
        Write-Host "❌ Route NOT registered!" -ForegroundColor Red
    } else {
        Write-Host "✅ Route exists (expected error: invalid token)" -ForegroundColor Green
    }
}
Write-Host ""

# Test 2: Step-up verification endpoint
Write-Host "Test 2: POST /api/auth/google/verify-stepup" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/google/verify-stepup" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"test@example.com","otp":"123456"}' `
        -ErrorAction SilentlyContinue
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode" -ForegroundColor $(if ($statusCode -eq 404) { "Red" } else { "Green" })
    
    if ($statusCode -eq 404) {
        Write-Host "❌ Route NOT registered!" -ForegroundColor Red
    } else {
        Write-Host "✅ Route exists (expected error: no verification found)" -ForegroundColor Green
    }
}
Write-Host ""

# Test 3: Sessions endpoint
Write-Host "Test 3: GET /api/auth/sessions" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/sessions" `
        -Method GET `
        -ErrorAction SilentlyContinue
    
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $statusCode" -ForegroundColor $(if ($statusCode -eq 404) { "Red" } elseif ($statusCode -eq 401) { "Green" } else { "Yellow" })
    
    if ($statusCode -eq 404) {
        Write-Host "❌ Route NOT registered!" -ForegroundColor Red
    } elseif ($statusCode -eq 401) {
        Write-Host "✅ Route exists (expected: requires authentication)" -ForegroundColor Green
    }
}
Write-Host ""

Write-Host "✨ Tests complete!`n" -ForegroundColor Cyan
