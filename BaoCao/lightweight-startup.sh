#!/bin/bash
# Script khởi động nhẹ cho EC2 instance nhỏ

cd /home/ubuntu/tranhuunhanminiclouddemo

echo "Starting essential services only..."

# Start database first
docker-compose up -d relational-database-server
sleep 10

# Start authentication
docker-compose up -d authentication-identity-server
sleep 10

# Start backend
docker-compose up -d application-backend-server
sleep 5

# Start frontend
docker-compose up -d web-frontend-server
sleep 5

# Start API gateway
docker-compose up -d api-gateway-proxy-server

echo "Essential services started. Monitoring services will start later..."

# Wait a bit then start monitoring (optional)
sleep 30
docker-compose up -d monitoring-grafana-dashboard-server
sleep 10
docker-compose up -d monitoring-prometheus-server

echo "All services started successfully!"
docker-compose ps