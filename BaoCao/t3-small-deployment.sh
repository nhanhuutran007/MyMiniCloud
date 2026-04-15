#!/bin/bash
# Script deploy tối ưu cho t3.small (2GB RAM, 2 vCPU)

cd /home/ubuntu/tranhuunhanminiclouddemo

echo "=== DEPLOYING ON T3.SMALL (2GB RAM, 2 vCPU) ==="

# Stop any running containers
docker-compose down

# Start all services (t3.small có đủ RAM)
echo "Starting all services..."
docker-compose up -d

echo "Waiting for services to initialize..."
sleep 30

echo "=== ALL SERVICES STARTED ==="
docker-compose ps

echo ""
echo "Memory usage:"
free -h

echo ""
echo "Docker stats:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "Test URLs:"
echo "- Main site: http://$(curl -s ifconfig.me)/"
echo "- Keycloak: http://$(curl -s ifconfig.me):8081/"
echo "- Grafana: http://$(curl -s ifconfig.me):3000/"
echo "- Prometheus: http://$(curl -s ifconfig.me):9090/"
echo "- MinIO Console: http://$(curl -s ifconfig.me):9001/"