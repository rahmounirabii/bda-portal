#!/bin/bash
set -e

# BDA Portal Deployment Script
# Usage: ./deploy.sh [portal|wordpress|supabase|all]

# Load credentials from .env.deploy (not committed to git)
if [ -f .env.deploy ]; then
    source .env.deploy
else
    echo "Missing .env.deploy file. Create it with:"
    echo "SSH_HOST=46.202.158.220"
    echo "SSH_PORT=65002"
    echo "SSH_USER=u746595765"
    echo "SSH_PASS='your-password'"
    exit 1
fi

PORTAL_PATH="~/domains/bda-global.org/public_html/portal/"
WP_THEME_PATH="~/domains/bda-global.org/public_html/wp-content/themes/jupiterx/"

# Local paths
LOCAL_WP_INC="/home/rr/Projets/FL/MSTQL/bda-association/public_html/wp-content/themes/jupiterx/inc"
LOCAL_WP_FUNCTIONS="/home/rr/Projets/FL/MSTQL/bda-association/public_html/wp-content/themes/jupiterx/functions.php"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

deploy_portal() {
    log "Building portal..."
    npm run build:client || error "Build failed"

    log "Deploying portal to $SSH_HOST..."
    sshpass -p "$SSH_PASS" scp -P $SSH_PORT -o StrictHostKeyChecking=no -r dist/spa/* ${SSH_USER}@${SSH_HOST}:${PORTAL_PATH}

    log "Portal deployed successfully!"
}

deploy_wordpress() {
    log "Deploying WordPress theme files from $LOCAL_WP_INC..."

    # Deploy inc folder
    sshpass -p "$SSH_PASS" scp -P $SSH_PORT -o StrictHostKeyChecking=no -r ${LOCAL_WP_INC}/* ${SSH_USER}@${SSH_HOST}:${WP_THEME_PATH}inc/

    # Deploy functions.php
    sshpass -p "$SSH_PASS" scp -P $SSH_PORT -o StrictHostKeyChecking=no ${LOCAL_WP_FUNCTIONS} ${SSH_USER}@${SSH_HOST}:${WP_THEME_PATH}

    log "WordPress theme deployed successfully!"
}

deploy_supabase() {
    log "Deploying Supabase Edge Functions..."

    if ! command -v supabase &> /dev/null; then
        warn "Supabase CLI not found. Install with: npm install -g supabase"
        return 1
    fi

    supabase functions deploy --project-ref dfsbzsxuursvqwnzruqt

    log "Supabase functions deployed successfully!"
}

show_help() {
    echo "BDA Portal Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  portal     Build and deploy React portal"
    echo "  wordpress  Deploy WordPress theme (inc folder)"
    echo "  supabase   Deploy Supabase Edge Functions"
    echo "  all        Deploy everything"
    echo "  help       Show this help"
    echo ""
}

case "${1:-all}" in
    portal)
        deploy_portal
        ;;
    wordpress)
        deploy_wordpress
        ;;
    supabase)
        deploy_supabase
        ;;
    all)
        deploy_portal
        deploy_wordpress
        # deploy_supabase  # Uncomment if needed
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        error "Unknown command: $1. Use './deploy.sh help' for usage."
        ;;
esac

echo ""
log "Done!"
