#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Keycloak Login Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Keycloak Server
Write-Host "Auth Testing Keycloak Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "OK Keycloak Server: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "FAILED Keycloak Server: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Realm Configuration
Write-Host ""
Write-Host "Realm Testing Realm Configuration..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/realms/TranHuuNhan_52300235" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "OK Realm TranHuuNhan_52300235: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "FAILED Realm TranHuuNhan_52300235: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Login URL
Write-Host ""
Write-Host "Login Testing Login URL..." -ForegroundColor Yellow
try {
    $loginUrl = "http://localhost:8081/realms/TranHuuNhan_52300235/protocol/openid-connect/auth?client_id=flask-app&redirect_uri=http://localhost&response_type=code&scope=openid"
    $response = Invoke-WebRequest -Uri $loginUrl -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200 -and $response.Content.Contains("Sign in")) {
        Write-Host "OK Login URL: OK (Login page accessible)" -ForegroundColor Green
    } else {
        Write-Host "WARNING Login URL: Unexpected response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "FAILED Login URL: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Web Frontend with Keycloak Integration
Write-Host ""
Write-Host "Web Testing Web Frontend with Keycloak..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200 -and $response.Content.Contains("keycloak-auth.js")) {
        Write-Host "OK Web Frontend: Keycloak integration loaded" -ForegroundColor Green
    } else {
        Write-Host "WARNING Web Frontend: Keycloak integration may not be loaded" -ForegroundColor Yellow
    }
} catch {
    Write-Host "FAILED Web Frontend: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Instructions
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Manual Login Test Instructions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open browser and go to: http://localhost" -ForegroundColor White
Write-Host "2. Click the 'Dang nhap' button in top right corner" -ForegroundColor White
Write-Host "3. You should be redirected to Keycloak login page" -ForegroundColor White
Write-Host "4. Login with:" -ForegroundColor White
Write-Host "   Username: sv01" -ForegroundColor Cyan
Write-Host "   Password: 123" -ForegroundColor Cyan
Write-Host "5. After login, you should see:" -ForegroundColor White
Write-Host "   - User info in top right corner" -ForegroundColor Green
Write-Host "   - Protected content section appears" -ForegroundColor Green
Write-Host "   - 'Test Secure API' button becomes available" -ForegroundColor Green
Write-Host ""

# Configuration Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Keycloak Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Keycloak Server: http://localhost:8081" -ForegroundColor White
Write-Host "Admin Console: http://localhost:8081/admin" -ForegroundColor White
Write-Host "Admin Credentials: admin / admin" -ForegroundColor White
Write-Host ""
Write-Host "Realm: TranHuuNhan_52300235" -ForegroundColor Cyan
Write-Host "Client ID: flask-app" -ForegroundColor Cyan
Write-Host "Client Type: Public Client" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test User:" -ForegroundColor Yellow
Write-Host "  Username: sv01" -ForegroundColor White
Write-Host "  Password: 123" -ForegroundColor White
Write-Host "  Email: nhanhuutran006@gmail.com" -ForegroundColor White
Write-Host "  Name: TRAN HUU NHAN" -ForegroundColor White
Write-Host ""
Write-Host "Ready for manual testing!" -ForegroundColor Green