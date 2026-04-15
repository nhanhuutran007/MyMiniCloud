# Script backup và restore volumes cho hệ thống mini cloud
# Sử dụng để backup dữ liệu trước khi deploy lên EC2

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("backup", "restore")]
    [string]$Action,
    
    [string]$BackupPath = "./backup-volumes"
)

function Backup-Volumes {
    Write-Host "=== BACKUP DOCKER VOLUMES ===" -ForegroundColor Green
    
    # Tạo thư mục backup
    if (!(Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force
    }
    
    # Backup MariaDB
    Write-Host "Backing up MariaDB data..." -ForegroundColor Yellow
    docker run --rm -v mariadb-data:/data -v "${PWD}/${BackupPath}:/backup" alpine tar czf /backup/mariadb-data.tar.gz -C /data .
    
    # Backup Keycloak
    Write-Host "Backing up Keycloak data..." -ForegroundColor Yellow
    docker run --rm -v keycloak-data:/data -v "${PWD}/${BackupPath}:/backup" alpine tar czf /backup/keycloak-data.tar.gz -C /data .
    
    # Backup Grafana
    Write-Host "Backing up Grafana data..." -ForegroundColor Yellow
    docker run --rm -v grafana-data:/data -v "${PWD}/${BackupPath}:/backup" alpine tar czf /backup/grafana-data.tar.gz -C /data .
    
    # Backup Prometheus
    Write-Host "Backing up Prometheus data..." -ForegroundColor Yellow
    docker run --rm -v prometheus-data:/data -v "${PWD}/${BackupPath}:/backup" alpine tar czf /backup/prometheus-data.tar.gz -C /data .
    
    Write-Host "Backup completed! Files saved to: $BackupPath" -ForegroundColor Green
    Get-ChildItem $BackupPath
}

function Restore-Volumes {
    Write-Host "=== RESTORE DOCKER VOLUMES ===" -ForegroundColor Green
    
    if (!(Test-Path $BackupPath)) {
        Write-Error "Backup path not found: $BackupPath"
        return
    }
    
    # Tạo volumes nếu chưa tồn tại
    docker volume create mariadb-data
    docker volume create keycloak-data
    docker volume create grafana-data
    docker volume create prometheus-data
    
    # Restore MariaDB
    if (Test-Path "$BackupPath/mariadb-data.tar.gz") {
        Write-Host "Restoring MariaDB data..." -ForegroundColor Yellow
        docker run --rm -v mariadb-data:/data -v "${PWD}/${BackupPath}:/backup" alpine tar xzf /backup/mariadb-data.tar.gz -C /data
    }
    
    # Restore Keycloak
    if (Test-Path "$BackupPath/keycloak-data.tar.gz") {
        Write-Host "Restoring Keycloak data..." -ForegroundColor Yellow
        docker run --rm -v keycloak-data:/data -v "${PWD}/${BackupPath}:/backup" alpine tar xzf /backup/keycloak-data.tar.gz -C /data
    }
    
    # Restore Grafana
    if (Test-Path "$BackupPath/grafana-data.tar.gz") {
        Write-Host "Restoring Grafana data..." -ForegroundColor Yellow
        docker run --rm -v grafana-data:/data -v "${PWD}/${BackupPath}:/backup" alpine tar xzf /backup/grafana-data.tar.gz -C /data
    }
    
    # Restore Prometheus
    if (Test-Path "$BackupPath/prometheus-data.tar.gz") {
        Write-Host "Restoring Prometheus data..." -ForegroundColor Yellow
        docker run --rm -v prometheus-data:/data -v "${PWD}/${BackupPath}:/backup" alpine tar xzf /backup/prometheus-data.tar.gz -C /data
    }
    
    Write-Host "Restore completed!" -ForegroundColor Green
}

# Main execution
switch ($Action) {
    "backup" { Backup-Volumes }
    "restore" { Restore-Volumes }
}

Write-Host "`nUsage examples:" -ForegroundColor Cyan
Write-Host "  .\volume-backup-restore.ps1 -Action backup" -ForegroundColor White
Write-Host "  .\volume-backup-restore.ps1 -Action restore" -ForegroundColor White
Write-Host "  .\volume-backup-restore.ps1 -Action backup -BackupPath ./my-backup" -ForegroundColor White