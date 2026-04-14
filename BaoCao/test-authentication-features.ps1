#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Authentication Features Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Homepage without login
Write-Host "Public Testing Homepage (No Login)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        if ($response.Content.Contains("loginPromptSection") -and $response.Content.Contains("Yêu cầu đăng nhập")) {
            Write-Host "OK Homepage: Login prompt displayed correctly" -ForegroundColor Green
        } else {
            Write-Host "WARNING Homepage: Login prompt may not be working" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "FAILED Homepage: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Blog access without login
Write-Host ""
Write-Host "Protected Testing Blog Access (No Login)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/blog/" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        if ($response.Content.Contains("Đăng nhập để truy cập Blog")) {
            Write-Host "OK Blog Protection: Login required message displayed" -ForegroundColor Green
        } else {
            Write-Host "WARNING Blog Protection: May not be properly protected" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "FAILED Blog Protection: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Students API still accessible (for fallback testing)
Write-Host ""
Write-Host "API Testing Students API (Direct Access)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/student/" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200 -and $response.Content.Contains("Danh Sach Sinh Vien")) {
        Write-Host "OK Students API: Still accessible for backend testing" -ForegroundColor Green
    }
} catch {
    Write-Host "FAILED Students API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Keycloak Login Flow
Write-Host ""
Write-Host "Auth Testing Keycloak Login Flow..." -ForegroundColor Yellow
try {
    $loginUrl = "http://localhost:8081/realms/TranHuuNhan_52300235/protocol/openid-connect/auth?client_id=flask-app&redirect_uri=http://localhost&response_type=code&scope=openid"
    $response = Invoke-WebRequest -Uri $loginUrl -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200 -and $response.Content.Contains("Sign in")) {
        Write-Host "OK Keycloak Login: Login page accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "FAILED Keycloak Login: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: System Panel Access
Write-Host ""
Write-Host "System Testing System Panel Access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/blog/system-panel.html" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200 -and $response.Content.Contains("System Services Panel")) {
        Write-Host "OK System Panel: Accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "FAILED System Panel: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Instructions for manual testing
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Manual Testing Instructions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "BEFORE LOGIN:" -ForegroundColor Yellow
Write-Host "1. Go to http://localhost" -ForegroundColor White
Write-Host "   - Should see 'Yêu cầu đăng nhập' section" -ForegroundColor Gray
Write-Host "   - Students section should be hidden" -ForegroundColor Gray
Write-Host "   - Blog link should be disabled" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Try to access http://localhost/blog/" -ForegroundColor White
Write-Host "   - Should see 'Đăng nhập để truy cập Blog' page" -ForegroundColor Gray
Write-Host ""
Write-Host "LOGIN PROCESS:" -ForegroundColor Yellow
Write-Host "3. Click 'Đăng nhập' button on homepage" -ForegroundColor White
Write-Host "4. Login with: sv01 / 123" -ForegroundColor Cyan
Write-Host ""
Write-Host "AFTER LOGIN:" -ForegroundColor Yellow
Write-Host "5. Homepage should show:" -ForegroundColor White
Write-Host "   - User info in top right" -ForegroundColor Green
Write-Host "   - Students Display section" -ForegroundColor Green
Write-Host "   - Protected content section" -ForegroundColor Green
Write-Host "   - Blog link should be enabled" -ForegroundColor Green
Write-Host ""
Write-Host "6. Blog access should work normally" -ForegroundColor White
Write-Host "7. Test Secure API button should be available" -ForegroundColor White
Write-Host ""

# Feature Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Protected Features Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROTECTED CONTENT (Login Required):" -ForegroundColor Red
Write-Host "  - Students Display & Statistics" -ForegroundColor White
Write-Host "  - Blog Access" -ForegroundColor White
Write-Host "  - Secure API Testing" -ForegroundColor White
Write-Host "  - Protected Content Section" -ForegroundColor White
Write-Host ""
Write-Host "PUBLIC CONTENT (No Login Required):" -ForegroundColor Green
Write-Host "  - Homepage (with login prompt)" -ForegroundColor White
Write-Host "  - System Panel" -ForegroundColor White
Write-Host "  - Direct API endpoints (for testing)" -ForegroundColor White
Write-Host ""
Write-Host "AUTHENTICATION:" -ForegroundColor Cyan
Write-Host "  - Keycloak SSO Integration" -ForegroundColor White
Write-Host "  - JWT Token Management" -ForegroundColor White
Write-Host "  - Auto Token Refresh" -ForegroundColor White
Write-Host "  - Fallback Demo Mode" -ForegroundColor White
Write-Host ""
Write-Host "Ready for authentication testing!" -ForegroundColor Green