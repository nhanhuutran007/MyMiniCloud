# PowerShell script để lấy nội dung SSH key cho GitHub Secrets
# Chạy script này trong thư mục chứa minicloud-key.pem

param(
    [string]$KeyFile = "minicloud-key.pem"
)

Write-Host "🔑 Getting SSH Key Content for GitHub Secrets" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check if key file exists
if (-not (Test-Path $KeyFile)) {
    Write-Host "❌ SSH key file '$KeyFile' not found!" -ForegroundColor Red
    Write-Host "Please ensure the SSH key file is in the current directory" -ForegroundColor Yellow
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SSH key file found: $KeyFile" -ForegroundColor Green

# Get file content
try {
    $keyContent = Get-Content $KeyFile -Raw
    
    # Validate key format
    if ($keyContent -match "-----BEGIN.*PRIVATE KEY-----" -and $keyContent -match "-----END.*PRIVATE KEY-----") {
        Write-Host "✅ SSH key format is valid" -ForegroundColor Green
        
        # Copy to clipboard
        $keyContent | Set-Clipboard
        Write-Host "✅ SSH key content copied to clipboard!" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Yellow
        Write-Host "1. Go to GitHub repository → Settings → Secrets and variables → Actions"
        Write-Host "2. Click 'New repository secret'"
        Write-Host "3. Name: MINICLOUD_SSH_KEY"
        Write-Host "4. Secret: Paste from clipboard (Ctrl+V)"
        Write-Host "5. Click 'Add secret'"
        
        Write-Host ""
        Write-Host "🔍 Key preview (first and last lines):" -ForegroundColor Cyan
        $lines = $keyContent -split "`n"
        Write-Host $lines[0] -ForegroundColor Gray
        Write-Host "... [content hidden for security] ..." -ForegroundColor Gray
        Write-Host $lines[-1] -ForegroundColor Gray
        
    } else {
        Write-Host "❌ Invalid SSH key format!" -ForegroundColor Red
        Write-Host "Expected format should include:" -ForegroundColor Yellow
        Write-Host "-----BEGIN RSA PRIVATE KEY-----" -ForegroundColor Gray
        Write-Host "[key content]" -ForegroundColor Gray
        Write-Host "-----END RSA PRIVATE KEY-----" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error reading SSH key file: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔐 All GitHub Secrets needed:" -ForegroundColor Cyan
Write-Host "├── DOCKER_USERNAME: nhanhuutran007"
Write-Host "├── DOCKER_PASSWORD: [your Docker Hub password]"
Write-Host "├── MINICLOUD_SSH_KEY: [copied to clipboard]"
Write-Host "└── MINICLOUD_HOST: ec2-13-214-23-181.ap-southeast-1.compute.amazonaws.com"