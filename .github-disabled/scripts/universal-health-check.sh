#!/bin/bash

# Universal Health Check Script for Docker Compose Projects
# Can be configured via environment variables or config file

set -e

# Default configuration (can be overridden)
PROJECT_NAME=${PROJECT_NAME:-"MyMiniCloud"}
CONFIG_FILE=${CONFIG_FILE:-".github/configs/project-config.yml"}
TIMEOUT=${TIMEOUT:-30}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect environment (local vs cloud)
detect_environment() {
    if curl -s -f --max-time 2 http://169.254.169.254/latest/meta-data/public-ipv4 > /dev/null 2>&1; then
        HOST=$(curl -s -f http://169.254.169.254/latest/meta-data/public-ipv4)
        ENV="EC2"
    else
        HOST="localhost"
        ENV="Local"
    fi
    
    log_info "Environment: $ENV"
    log_info "Host: $HOST"
}

# Function to check Docker Compose services
check_docker_services() {
    log_info "Checking Docker Compose services..."
    
    if ! command_exists docker; then
        log_error "Docker is not installed or not in PATH"
        return 1
    fi
    
    if ! docker compose ps --format "table {{.Name}}\t{{.Status}}" | grep -q "Up"; then
        log_error "No Docker services are running"
        return 1
    fi
    
    # Count running services
    RUNNING_SERVICES=$(docker compose ps --format "{{.Name}}" --filter "status=running" | wc -l)
    TOTAL_SERVICES=$(docker compose ps --format "{{.Name}}" | wc -l)
    
    log_info "Services running: $RUNNING_SERVICES/$TOTAL_SERVICES"
    
    if [ "$RUNNING_SERVICES" -eq "$TOTAL_SERVICES" ]; then
        log_success "All Docker services are running"
        return 0
    else
        log_warning "Some services are not running"
        docker compose ps
        return 1
    fi
}

# Function to check HTTP endpoints
check_http_endpoints() {
    log_info "Checking HTTP endpoints..."
    
    # Default endpoints (can be customized)
    ENDPOINTS=(
        "$HOST:80|API Gateway"
        "$HOST:8080|Web Frontend"
        "$HOST:8085|Backend API"
        "$HOST:9001|MinIO Console"
        "$HOST:3000|Grafana"
        "$HOST:9090|Prometheus"
    )
    
    local failed=0
    
    for endpoint in "${ENDPOINTS[@]}"; do
        IFS='|' read -r url desc <<< "$endpoint"
        
        if curl -s --max-time $TIMEOUT -I "http://$url" > /dev/null 2>&1; then
            log_success "$desc - http://$url"
        else
            log_error "$desc - http://$url"
            failed=$((failed + 1))
        fi
    done
    
    if [ $failed -eq 0 ]; then
        log_success "All HTTP endpoints are accessible"
        return 0
    else
        log_warning "$failed endpoint(s) failed"
        return 1
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    log_info "Testing API endpoints..."
    
    # Test API endpoints
    API_TESTS=(
        "/api/hello|Hello API"
        "/student/|Student API"
    )
    
    local failed=0
    
    for test in "${API_TESTS[@]}"; do
        IFS='|' read -r endpoint desc <<< "$test"
        
        response=$(curl -s -w "%{http_code}" "http://$HOST$endpoint" -o /dev/null)
        if [ "$response" = "200" ]; then
            log_success "$desc - http://$HOST$endpoint"
        else
            log_error "$desc - http://$HOST$endpoint (HTTP $response)"
            failed=$((failed + 1))
        fi
    done
    
    if [ $failed -eq 0 ]; then
        log_success "All API tests passed"
        return 0
    else
        log_warning "$failed API test(s) failed"
        return 1
    fi
}

# Function to test load balancer
test_load_balancer() {
    log_info "Testing Load Balancer..."
    
    local servers_found=()
    
    for i in {1..5}; do
        result=$(curl -s "http://$HOST" | grep -oEi "Server_[a-zA-Z0-9_-]+|Server [a-zA-Z0-9_-]+" | head -1 || echo "No server info")
        servers_found+=("$result")
        log_info "Request $i: $result"
    done
    
    # Check if we got more than 1 unique server
    unique_servers=$(printf '%s\n' "${servers_found[@]}" | grep -v "No server info" | sort -u | wc -l)
    
    if [ "$unique_servers" -ge 2 ]; then
        log_success "Load Balancer is working (Round Robin detected)"
        return 0
    else
        log_warning "Load Balancer may not be working properly"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    log_info "Testing Database Connection..."
    
    local max_retries=10
    local retry_count=0
    local success=0
    
    while [ $retry_count -lt $max_retries ]; do
        if docker exec relational-database-server mariadb -u root -proot -e "SELECT 1" > /dev/null 2>&1; then
            log_success "Database connection successful"
            success=1
            break
        fi
        retry_count=$((retry_count + 1))
        log_warning "Database not ready yet, retrying in 3s... ($retry_count/$max_retries)"
        sleep 3
    done
    
    if [ $success -eq 1 ]; then
        # Get student count if available
        student_count=$(docker exec relational-database-server mariadb -u root -proot studentdb -e "SELECT COUNT(*) FROM students;" -s -N 2>/dev/null || echo "N/A")
        log_info "Students in database: $student_count"
        return 0
    else
        log_error "Database connection failed after $max_retries attempts"
        return 1
    fi
}

# Function to check internal network
check_internal_network() {
    log_info "Testing Internal Network..."
    
    if docker run --rm --network cloud-net alpine ping -c 1 web-frontend-server-1 > /dev/null 2>&1; then
        log_success "Internal network connectivity OK"
        return 0
    else
        log_error "Internal network connectivity failed"
        return 1
    fi
}

# Main health check function
main() {
    echo "🔍 $PROJECT_NAME Health Check"
    echo "================================"
    
    detect_environment
    echo ""
    
    local total_checks=0
    local passed_checks=0
    
    # Run all checks
    checks=(
        "check_docker_services"
        "check_http_endpoints"
        "test_api_endpoints"
        "test_load_balancer"
        "check_database"
        "check_internal_network"
    )
    
    for check in "${checks[@]}"; do
        total_checks=$((total_checks + 1))
        echo ""
        if $check; then
            passed_checks=$((passed_checks + 1))
        fi
    done
    
    # Summary
    echo ""
    echo "📋 Health Check Summary"
    echo "======================"
    log_info "Environment: $ENV"
    log_info "Host: $HOST"
    log_info "Checks passed: $passed_checks/$total_checks"
    
    if [ $passed_checks -eq $total_checks ]; then
        log_success "All health checks passed! 🎉"
        echo ""
        echo "🔗 Quick Access Links:"
        echo "   Main App: http://$HOST"
        echo "   MinIO: http://$HOST:9001 (minioadmin/minioadmin)"
        echo "   Grafana: http://$HOST:3000 (admin/admin)"
        echo "   Prometheus: http://$HOST:9090"
        return 0
    else
        log_warning "Some health checks failed"
        return 1
    fi
}

# Run main function
main "$@"