Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Load Balancing Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing Web Frontend Load Balancing..." -ForegroundColor Yellow
Write-Host "Making 10 requests to see different container IDs:" -ForegroundColor Yellow
Write-Host ""

$containerIds = @()

for ($i = 1; $i -le 10; $i++) {
    Write-Host "Request $i`: " -NoNewline -ForegroundColor Green
    try {
        $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 5
        $containerMatch = $response.Content | Select-String "Container: ([a-f0-9]+)"
        if ($containerMatch) {
            $containerId = $containerMatch.Matches[0].Groups[1].Value
            $containerIds += $containerId
            Write-Host "Container ID: $containerId" -ForegroundColor White
        } else {
            Write-Host "No Container ID found" -ForegroundColor Red
        }
    } catch {
        Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Load Balancing Results" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$uniqueContainers = $containerIds | Sort-Object | Get-Unique
Write-Host "Unique Container IDs found: $($uniqueContainers.Count)" -ForegroundColor Green
foreach ($id in $uniqueContainers) {
    $count = ($containerIds | Where-Object { $_ -eq $id }).Count
    Write-Host "  - $id`: $count requests" -ForegroundColor White
}

Write-Host ""
if ($uniqueContainers.Count -gt 1) {
    Write-Host "✅ Load balancing is working! Multiple containers are serving requests." -ForegroundColor Green
} else {
    Write-Host "⚠️  Load balancing may not be working. Only one container ID detected." -ForegroundColor Yellow
    Write-Host "   This could be due to:" -ForegroundColor Yellow
    Write-Host "   - Only one instance is running" -ForegroundColor Yellow
    Write-Host "   - Load balancer is not distributing requests" -ForegroundColor Yellow
    Write-Host "   - Browser/client caching" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Container Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
docker-compose ps web-frontend-server
docker-compose ps application-backend-server

Write-Host ""
Write-Host "Manual Test: Open http://localhost in browser and refresh multiple times" -ForegroundColor Cyan
Write-Host "You should see the Container ID change in the navigation bar" -ForegroundColor Cyan