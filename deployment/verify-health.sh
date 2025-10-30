#!/bin/bash

# PromptLens Phase 1 Deployment Health Check Script
# This script verifies that all deployed services are healthy and accessible

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-https://api.promptlens.app}"
DASHBOARD_URL="${DASHBOARD_URL:-https://dashboard.promptlens.app}"

echo "🔍 Verifying Phase 1 Deployment Health..."
echo "==========================================="
echo ""

# Function to check HTTP status
check_endpoint() {
  local url=$1
  local name=$2
  local expected_status=${3:-200}
  
  echo -n "Checking $name... "
  
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10 || echo "000")
  
  if [ "$status" -eq "$expected_status" ]; then
    echo -e "${GREEN}✅ OK${NC} (HTTP $status)"
    return 0
  else
    echo -e "${RED}❌ FAILED${NC} (HTTP $status, expected $expected_status)"
    return 1
  fi
}

# Track failures
FAILED=0

# 1. Backend API Health Check
echo "📡 Backend API"
echo "-------------"
if check_endpoint "$BACKEND_URL/health" "Health endpoint"; then
  :
else
  ((FAILED++))
fi
echo ""

# 2. Web Dashboard
echo "🌐 Web Dashboard"
echo "---------------"
if check_endpoint "$DASHBOARD_URL" "Homepage"; then
  :
else
  ((FAILED++))
fi
echo ""

# 3. Database connectivity (via API)
echo "🗄️  Database"
echo "-----------"
if check_endpoint "$BACKEND_URL/api/health/db" "Database connection" 200; then
  :
else
  echo -e "${YELLOW}⚠️  Warning: Database health endpoint not available${NC}"
fi
echo ""

# 4. Stripe webhook endpoint
echo "💳 Stripe Webhook"
echo "----------------"
# Webhook endpoint should be accessible but reject requests without signature (400)
echo -n "Checking webhook endpoint... "
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BACKEND_URL/api/upgrade" --max-time 10 || echo "000")
if [ "$status" -eq 400 ]; then
  echo -e "${GREEN}✅ OK${NC} (HTTP $status - signature validation active)"
elif [ "$status" -eq 404 ]; then
  echo -e "${RED}❌ FAILED${NC} (HTTP 404 - endpoint not found)"
  ((FAILED++))
else
  echo -e "${YELLOW}⚠️  Warning${NC} (HTTP $status - unexpected response)"
fi
echo ""

# Summary
echo "==========================================="
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All health checks passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILED health check(s) failed${NC}"
  echo ""
  echo "Troubleshooting tips:"
  echo "1. Verify all services are deployed and running"
  echo "2. Check service logs for errors"
  echo "3. Ensure environment variables are set correctly"
  echo "4. Verify DNS records are properly configured"
  echo "5. Check firewall and security group settings"
  exit 1
fi
