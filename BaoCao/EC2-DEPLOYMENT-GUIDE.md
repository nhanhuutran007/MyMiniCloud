# Hướng dẫn Deploy lên EC2 với Volume Persistence

## Vấn đề đã được giải quyết

Trước đây, khi deploy lên EC2, các dữ liệu sau bị mất:
- Dashboard và cấu hình Grafana
- User, realm và cấu hình Keycloak
- Dữ liệu metrics Prometheus
- Dữ liệu database MariaDB

**Giải pháp**: Đã thêm Docker volumes persistence cho tất cả các service quan trọng.

## Cấu hình Volume Persistence

### Volumes đã được thêm:
```yaml
volumes:
  mariadb-data: /var/lib/mysql
  keycloak-data: /opt/keycloak/data
  grafana-data: /var/lib/grafana
  prometheus-data: /prometheus
```

## Quy trình Deploy lên EC2

### 1. Backup dữ liệu trước khi deploy (nếu có)
```powershell
# Backup tất cả volumes
.\BaoCao\volume-backup-restore.ps1 -Action backup

# Upload backup lên EC2
scp -r backup-volumes ec2-user@your-ec2-ip:/home/ec2-user/
```

### 2. Setup trên EC2

#### Cài đặt Docker và Docker Compose
```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Clone và setup project
```bash
# Clone repository
git clone <your-repo-url>
cd tranhuunhanminiclouddemo

# Tạo volumes trước (optional nhưng recommended)
docker volume create mariadb-data
docker volume create keycloak-data
docker volume create grafana-data
docker volume create prometheus-data
```

### 3. Restore dữ liệu (nếu có backup)
```bash
# Copy backup files vào project
cp -r /home/ec2-user/backup-volumes ./

# Restore volumes
docker run --rm -v mariadb-data:/data -v $(pwd)/backup-volumes:/backup alpine tar xzf /backup/mariadb-data.tar.gz -C /data
docker run --rm -v keycloak-data:/data -v $(pwd)/backup-volumes:/backup alpine tar xzf /backup/keycloak-data.tar.gz -C /data
docker run --rm -v grafana-data:/data -v $(pwd)/backup-volumes:/backup alpine tar xzf /backup/grafana-data.tar.gz -C /data
docker run --rm -v prometheus-data:/data -v $(pwd)/backup-volumes:/backup alpine tar xzf /backup/prometheus-data.tar.gz -C /data
```

### 4. Deploy hệ thống
```bash
# Start all services
docker-compose up -d

# Kiểm tra status
docker-compose ps
docker volume ls
```

### 5. Cấu hình Security Group EC2

Mở các ports sau trong Security Group:
- Port 80: HTTP (API Gateway)
- Port 3000: Grafana Dashboard
- Port 8081: Keycloak Admin
- Port 9000-9001: MinIO (nếu cần truy cập từ bên ngoài)
- Port 9090: Prometheus (nếu cần truy cập từ bên ngoài)

## Backup định kỳ trên EC2

### Tạo cron job để backup tự động
```bash
# Tạo script backup
cat > /home/ec2-user/backup-script.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/tranhuunhanminiclouddemo
BACKUP_DIR="/home/ec2-user/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

docker run --rm -v mariadb-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/mariadb-data.tar.gz -C /data .
docker run --rm -v keycloak-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/keycloak-data.tar.gz -C /data .
docker run --rm -v grafana-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/grafana-data.tar.gz -C /data .
docker run --rm -v prometheus-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/prometheus-data.tar.gz -C /data .

# Xóa backup cũ hơn 7 ngày
find /home/ec2-user/backups -type d -mtime +7 -exec rm -rf {} +
EOF

chmod +x /home/ec2-user/backup-script.sh

# Thêm vào crontab (backup hàng ngày lúc 2:00 AM)
echo "0 2 * * * /home/ec2-user/backup-script.sh" | crontab -
```

## Kiểm tra Volume Persistence

### Kiểm tra volumes đã được tạo
```bash
docker volume ls
```

### Kiểm tra dữ liệu trong volumes
```bash
# Kiểm tra Keycloak data
docker run --rm -v keycloak-data:/data alpine ls -la /data

# Kiểm tra Grafana data
docker run --rm -v grafana-data:/data alpine ls -la /data

# Kiểm tra MariaDB data
docker run --rm -v mariadb-data:/data alpine ls -la /data
```

## Troubleshooting

### Nếu volumes không mount đúng
```bash
# Stop all services
docker-compose down

# Remove containers (giữ lại volumes)
docker container prune -f

# Restart
docker-compose up -d
```

### Nếu cần reset hoàn toàn
```bash
# Stop và remove tất cả
docker-compose down -v

# Xóa volumes (CẨNH THẬN: sẽ mất dữ liệu)
docker volume rm mariadb-data keycloak-data grafana-data prometheus-data

# Start lại từ đầu
docker-compose up -d
```

## Lưu ý quan trọng

1. **Luôn backup trước khi deploy**: Sử dụng script `volume-backup-restore.ps1`
2. **Kiểm tra volumes sau khi deploy**: Đảm bảo dữ liệu đã được restore đúng
3. **Setup backup định kỳ**: Tránh mất dữ liệu do sự cố
4. **Monitor disk space**: Volumes có thể tăng kích thước theo thời gian
5. **Test restore process**: Thử nghiệm quy trình restore trước khi cần thiết

Với cấu hình này, dữ liệu sẽ được lưu trữ persistent và không bị mất khi restart containers hoặc redeploy hệ thống.