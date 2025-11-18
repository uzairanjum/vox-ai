#!/bin/bash

# =================================================================
# VOX CRON AI - SECURE DEPLOYMENT SCRIPT
# =================================================================
# This script helps deploy the Vox Cron AI system securely
# Usage: ./scripts/deploy.sh [environment] [mode]
# Example: ./scripts/deploy.sh production docker

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
LOG_FILE="$PROJECT_DIR/logs/deploy.log"

# Default values
ENVIRONMENT="${1:-development}"
DEPLOY_MODE="${2:-systemd}"
SKIP_CHECKS="${SKIP_CHECKS:-false}"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    echo "[ERROR] $1" >> "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
    echo "[WARNING] $1" >> "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
    echo "[INFO] $1" >> "$LOG_FILE"
}

check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root (should not be)
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
    
    # Check required commands
    local required_commands=("python3" "curl" "uv")
    if [[ "$DEPLOY_MODE" == "docker" ]]; then
        required_commands+=("docker" "docker-compose")
    fi
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command '$cmd' not found"
        fi
    done
    
    # Check Python version
    local python_version=$(python3 -c "import sys; print('.'.join(map(str, sys.version_info[:2])))")
    if [[ $(echo "$python_version < 3.9" | bc -l) -eq 1 ]]; then
        error "Python 3.9+ required, found $python_version"
    fi
    
    log "Prerequisites check passed"
}

validate_environment() {
    log "Validating environment configuration..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        error ".env file not found. Copy example.env to .env and configure it."
    fi
    
    # Check for required environment variables
    local required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_KEY" "GHL_ACCESS_TOKEN")
    if [[ "$ENVIRONMENT" == "production" ]]; then
        required_vars+=("API_SECRET_KEY" "API_ACCESS_TOKEN")
    fi
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$ENV_FILE" || grep -q "^$var=your-" "$ENV_FILE"; then
            error "Environment variable '$var' not properly configured in .env"
        fi
    done
    
    # Security checks for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if grep -q "API_SECRET_KEY=development-secret" "$ENV_FILE"; then
            error "Default API secret key found in production environment"
        fi
        
        if grep -q "ALLOWED_ORIGINS=\*" "$ENV_FILE"; then
            warning "CORS is set to allow all origins in production"
        fi
        
        if ! grep -q "ENABLE_API_AUTH=true" "$ENV_FILE"; then
            warning "API authentication is not enabled in production"
        fi
    fi
    
    log "Environment validation passed"
}

setup_directories() {
    log "Setting up directories..."
    
    # Create necessary directories
    mkdir -p "$PROJECT_DIR/logs"
    mkdir -p "$PROJECT_DIR/backups"
    
    # Set proper permissions
    chmod 755 "$PROJECT_DIR/logs"
    chmod 700 "$PROJECT_DIR/backups"
    
    # Ensure .env has secure permissions
    if [[ -f "$ENV_FILE" ]]; then
        chmod 600 "$ENV_FILE"
    fi
    
    log "Directories setup completed"
}

install_dependencies() {
    log "Installing dependencies..."
    
    cd "$PROJECT_DIR"
    
    # Update UV to latest version
    uv self update || true
    
    # Install dependencies
    if [[ "$ENVIRONMENT" == "production" ]]; then
        uv sync --frozen --extra production
    else
        uv sync
    fi
    
    log "Dependencies installed"
}

run_security_checks() {
    if [[ "$SKIP_CHECKS" == "true" ]]; then
        warning "Skipping security checks (SKIP_CHECKS=true)"
        return
    fi
    
    log "Running security checks..."
    
    cd "$PROJECT_DIR"
    
    # Test configuration
    if ! uv run python -c "from config import settings; settings.validate_supabase_config(); settings.validate_security_config()"; then
        error "Configuration validation failed"
    fi
    
    # Test database connectivity
    if ! uv run python -c "
import asyncio
from main import init_supabase
try:
    init_supabase()
    print('Database connectivity: OK')
except Exception as e:
    print(f'Database connectivity: FAILED - {e}')
    exit(1)
"; then
        error "Database connectivity test failed"
    fi
    
    # Test health endpoint
    info "Starting temporary server for health check..."
    uv run uvicorn main:app --host 127.0.0.1 --port 8001 &
    local server_pid=$!
    
    sleep 5  # Wait for server to start
    
    if curl -f http://127.0.0.1:8001/health &>/dev/null; then
        log "Health check passed"
    else
        kill $server_pid 2>/dev/null || true
        error "Health check failed"
    fi
    
    kill $server_pid 2>/dev/null || true
    
    log "Security checks completed"
}

deploy_systemd() {
    log "Deploying with systemd..."
    
    local service_file="/etc/systemd/system/vox-autopilot.service"
    local service_content="[Unit]
Description=Vox Cron AI Autopilot Service
After=network.target

[Service]
Type=exec
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR
Environment=PATH=$PROJECT_DIR/.venv/bin
EnvironmentFile=$ENV_FILE
ExecStart=$PROJECT_DIR/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=3

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$PROJECT_DIR/logs

[Install]
WantedBy=multi-user.target"

    echo "$service_content" | sudo tee "$service_file" > /dev/null
    
    sudo systemctl daemon-reload
    sudo systemctl enable vox-autopilot
    sudo systemctl restart vox-autopilot
    
    sleep 3
    
    if sudo systemctl is-active --quiet vox-autopilot; then
        log "Service started successfully"
        sudo systemctl status vox-autopilot --no-pager
    else
        error "Service failed to start"
    fi
}

deploy_docker() {
    log "Deploying with Docker..."
    
    cd "$PROJECT_DIR"
    
    # Build image
    docker build -t vox-autopilot:latest .
    
    # Stop existing containers
    docker-compose down || true
    
    # Start services
    docker-compose up -d
    
    # Wait for health check
    info "Waiting for services to start..."
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker-compose ps | grep -q "Up (healthy)"; then
            log "Services started successfully"
            docker-compose ps
            return
        fi
        sleep 2
        ((retries--))
    done
    
    error "Services failed to start properly"
}

setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create logrotate configuration
    local logrotate_config="/etc/logrotate.d/vox-autopilot"
    local logrotate_content="$PROJECT_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    copytruncate
    create 644 $USER $USER
}"

    echo "$logrotate_content" | sudo tee "$logrotate_config" > /dev/null
    
    # Test logrotate configuration
    sudo logrotate -d "$logrotate_config"
    
    log "Monitoring setup completed"
}

print_post_deploy_info() {
    log "Deployment completed successfully!"
    
    echo
    echo "=================================="
    echo "🚀 DEPLOYMENT SUMMARY"
    echo "=================================="
    echo "Environment: $ENVIRONMENT"
    echo "Deploy Mode: $DEPLOY_MODE"
    echo "Project Dir: $PROJECT_DIR"
    echo
    echo "📋 Next Steps:"
    echo "1. Test the application: curl http://localhost:8000/health"
    echo "2. Check logs: tail -f $PROJECT_DIR/logs/vox_cron_ai.log"
    echo "3. Monitor system: curl http://localhost:8000/stats"
    echo
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo "🔒 Production Security Reminders:"
        echo "- Ensure firewall is configured (ports 80, 443, 22 only)"
        echo "- SSL certificates are properly configured"
        echo "- Regular security updates are scheduled"
        echo "- Backup strategy is implemented"
        echo "- Monitoring alerts are configured"
        echo
    fi
    
    echo "📖 Documentation: See SETUP_GUIDE.md for detailed information"
    echo "🐛 Issues: Check logs and troubleshooting section in docs"
    echo "=================================="
}

# Main deployment flow
main() {
    log "Starting deployment for environment: $ENVIRONMENT (mode: $DEPLOY_MODE)"
    
    # Create logs directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    check_prerequisites
    validate_environment
    setup_directories
    install_dependencies
    run_security_checks
    
    case "$DEPLOY_MODE" in
        "systemd")
            deploy_systemd
            ;;
        "docker")
            deploy_docker
            ;;
        *)
            error "Unknown deployment mode: $DEPLOY_MODE. Use 'systemd' or 'docker'"
            ;;
    esac
    
    setup_monitoring
    print_post_deploy_info
}

# Script usage
usage() {
    echo "Usage: $0 [environment] [mode]"
    echo
    echo "Environments:"
    echo "  development (default) - Development setup"
    echo "  staging              - Staging environment"
    echo "  production           - Production deployment with security hardening"
    echo
    echo "Modes:"
    echo "  systemd (default)    - Deploy as systemd service"
    echo "  docker               - Deploy using Docker Compose"
    echo
    echo "Environment Variables:"
    echo "  SKIP_CHECKS=true     - Skip security validation checks"
    echo
    echo "Examples:"
    echo "  $0                          # Development with systemd"
    echo "  $0 production docker        # Production with Docker"
    echo "  SKIP_CHECKS=true $0 staging # Staging without checks"
}

# Handle command line arguments
if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

# Run main function
main "$@" 