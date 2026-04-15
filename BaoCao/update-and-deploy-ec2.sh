#!/bin/bash
# Script để pull thay đổi mới từ GitHub và deploy lại trên EC2

echo "=== UPDATING AND DEPLOYING ON EC2 ==="

# Bước 1: Stop hệ thống hiện tại
echo "Stopping current system..."
cd /home/ubuntu/tranhuunhanminiclouddemo
docker-compose down

# Bước 2: Backup dữ liệu hiện tại (nếu cần)
echo "Creating backup..."
BACKUP_DIR="/home/ubuntu/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
docker run --rm -v mariadb-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/mariadb-data.tar.gz -C /data . 2>/dev/null || echo "MariaDB backup skipped"
docker run --rm -v keycloak-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/keycloak-data.tar.gz -C /data . 2>/dev/null || echo "Keycloak backup skipped"
docker run --rm -v grafana-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/grafana-data.tar.gz -C /data . 2>/dev/null || echo "Grafana backup skipped"

# Bước 3: Pull thay đổi mới từ GitHub
echo "Pulling latest changes from GitHub..."
cd /home/ubuntu
git pull origin main || git pull origin master

# Nếu có conflict, hiển thị hướng dẫn
if [ $? -ne 0 ]; then
    echo "Git pull failed. You may need to resolve conflicts manually:"
    echo "1. git status"
    echo "2. git stash (to save local changes)"
    echo "3. git pull"
    echo "4. git stash pop (to restore local changes)"
    exit 1
fi

# Bước 4: Cập nhật docker-compose.yml nếu có thay đổi
echo "Updating docker-compose.yml..."
cd tranhuunhanminiclouddemo

# Bước 5: Pull latest images từ Docker Hub
echo "Pulling latest Docker images..."
docker-compose pull

# Bước 6: Build lại images nếu có Dockerfile thay đổi
echo "Building updated images..."
docker-compose build --no-cache

# Bước 7: Deploy hệ thống với cấu hình mới
echo "Deploying updated system..."
docker-compose up -d

# Bước 8: Kiểm tra trạng thái
echo "Checking system status..."
sleep 30
docker-compose ps

echo ""
echo "=== DEPLOYMENT COMPLETED ==="
echo "System URLs:"
echo "- Main site: http://$(curl -s ifconfig.me)/"
echo "- Keycloak: http://$(curl -s ifconfig.me):8081/"
echo "- Grafana: http://$(curl -s ifconfig.me):3000/"
echo "- Prometheus: http://$(curl -s ifconfig.me):9090/"
echo "- MinIO Console: http://$(curl -s ifconfig.me):9001/"

echo ""
echo "Backup saved to: $BACKUP_DIR"