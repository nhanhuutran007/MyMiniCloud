#!/bin/bash

# Universal Deployment Script for Docker Compose Projects
# Can be reused across different projects by changing configuration

set -e

# Configuration (can be overridden by environment variables)
PROJECT_NAME=${PROJECT_NAME:-"MyMiniCloud"}
DEPLOY_PATH=${DEPLOY_PATH:-"/home/ubuntu/MyMiniCloud/tranhuunhanminiclouddemo"}
BRANCH=${BRANCH:-"main"}
HEALTH_CHECK_SCRIPT=${HEALTH_CHECK_SCRIPT:-"./health-check.sh"}
BACKUP_ENABLED=${BACKUP_ENABLED:-"true"}

echo "🚀 Starting deployment for $PROJECT_NAME"
echo "📍 Deploy path: $DEPLOY_PATH"
echo "🌿 Branch: $BRANCH"
echo "⏰ Timestamp: $(date)"

# Function to run commands with error handling
run_command() {
    echo "▶️ Running: $1"
    if eval "$1"; then
        echo "✅ Success: $1"
    else
        echo "❌ Failed: $1"
        exit 1
    fi
}

# Function to backup current deployment
backup_deployment() {
    if [ "$BACKUP_ENABLED" = "true" ]; then
        echo "💾 Creating backup..."
        BACKUP_DIR="/tmp/backup-$(date +%Y%m%d_%H%M%S)"
        run_command "mkdir -p $BACKUP_DIR"
        run_command "cp -r $DEPLOY_PATH $BACKUP_DIR/"
        echo "✅ Backup created at: $BACKUP_DIR"
    fi
}

# Function to check if services are healthy
health_check() {
    echo "🔍 Running health checks..."
    if [ -f "$DEPLOY_PATH/$HEALTH_CHECK_SCRIPT" ]; then
        cd "$DEPLOY_PATH"
        chmod +x "$HEALTH_CHECK_SCRIPT"
        if ./"$HEALTH_CHECK_SCRIPT"; then
            echo "✅ Health check passed"
            return 0
        else
            echo "❌ Health check failed"
            return 1
        fi
    else
        echo "⚠️ No health check script found, skipping..."
        return 0
    fi
}

# Function to rollback deployment
rollback_deployment() {
    echo "🔄 Rolling back deployment..."
    run_command "docker compose down"
    run_command "git reset --hard HEAD~1"
    run_command "docker compose up -d"
    echo "✅ Rollback completed"
}

# Main deployment process
main() {
    echo "🏁 Starting main deployment process..."
    
    # Navigate to project directory
    run_command "cd $DEPLOY_PATH"
    
    # Create backup
    backup_deployment
    
    # Stop services gracefully
    echo "⏹️ Stopping services..."
    run_command "docker compose down"
    
    # Update code
    echo "📥 Updating code..."
    run_command "git fetch origin"
    run_command "git checkout $BRANCH"
    run_command "git pull origin $BRANCH"
    
    # Pull latest images
    echo "📦 Pulling latest Docker images..."
    run_command "docker compose pull"
    
    # Start services
    echo "🚀 Starting services..."
    run_command "docker compose up -d"
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 60
    
    # Run health checks
    if ! health_check; then
        echo "❌ Deployment failed health checks, rolling back..."
        rollback_deployment
        exit 1
    fi
    
    # Cleanup old images
    echo "🧹 Cleaning up old Docker images..."
    run_command "docker image prune -f"
    
    echo "🎉 Deployment completed successfully!"
    echo "📊 Final status:"
    run_command "docker compose ps"
}

# Trap errors and provide cleanup
trap 'echo "❌ Deployment failed at line $LINENO"' ERR

# Run main deployment
main "$@"