#!/bin/bash

echo "=== FIXING PROMETHEUS STORAGE ISSUE ==="
echo ""

# Stop Prometheus container
echo "🛑 Stopping Prometheus container..."
docker stop monitoring-prometheus-server

# Remove corrupted volume data
echo "🗑️ Removing corrupted Prometheus data..."
docker volume rm tranhuunhanminiclouddemo_prometheus-data 2>/dev/null || true

# Recreate volume
echo "📦 Creating fresh Prometheus volume..."
docker volume create tranhuunhanminiclouddemo_prometheus-data

# Restart Prometheus with clean state
echo "🚀 Starting Prometheus with clean storage..."
docker start monitoring-prometheus-server

# Wait for startup
echo "⏳ Waiting for Prometheus to start..."
sleep 10

# Check status
echo "✅ Checking Prometheus status..."
docker ps | grep prometheus
echo ""

# Test Prometheus endpoint
echo "🔍 Testing Prometheus endpoint..."
curl -s -I http://localhost:9090 | head -3

echo ""
echo "✅ Prometheus storage fix completed!"