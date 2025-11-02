#!/bin/bash

# Validation script for auth debug and token verification fix

echo "🔍 Validating Auth Debug and Token Verification Changes..."
echo ""

# Check if all modified files exist and have the expected content
echo "✅ Checking modified files..."

# Backend files
if [ -f "backend/src/services/auth.service.ts" ]; then
    if grep -q "🔍 Token received:" "backend/src/services/auth.service.ts"; then
        echo "  ✓ backend/src/services/auth.service.ts - Debug logging added"
    else
        echo "  ✗ backend/src/services/auth.service.ts - Debug logging MISSING"
        exit 1
    fi
else
    echo "  ✗ backend/src/services/auth.service.ts - FILE NOT FOUND"
    exit 1
fi

if [ -f "backend/src/middlewares/auth.ts" ]; then
    if grep -q "📨 Auth header received:" "backend/src/middlewares/auth.ts"; then
        echo "  ✓ backend/src/middlewares/auth.ts - Debug logging added"
    else
        echo "  ✗ backend/src/middlewares/auth.ts - Debug logging MISSING"
        exit 1
    fi
else
    echo "  ✗ backend/src/middlewares/auth.ts - FILE NOT FOUND"
    exit 1
fi

# Frontend files
if [ -f "web/src/services/api.ts" ]; then
    if grep -q "🎫 Sending token:" "web/src/services/api.ts"; then
        echo "  ✓ web/src/services/api.ts - Debug logging added"
    else
        echo "  ✗ web/src/services/api.ts - Debug logging MISSING"
        exit 1
    fi
else
    echo "  ✗ web/src/services/api.ts - FILE NOT FOUND"
    exit 1
fi

if [ -f "web/src/pages/api/token.ts" ]; then
    if grep -q "req.cookies\['next-auth.session-token'\]" "web/src/pages/api/token.ts"; then
        echo "  ✓ web/src/pages/api/token.ts - Session token extraction added"
    else
        echo "  ✗ web/src/pages/api/token.ts - Session token extraction MISSING"
        exit 1
    fi
    
    if grep -q "🍪 Session token from cookie:" "web/src/pages/api/token.ts"; then
        echo "  ✓ web/src/pages/api/token.ts - Debug logging added"
    else
        echo "  ✗ web/src/pages/api/token.ts - Debug logging MISSING"
        exit 1
    fi
else
    echo "  ✗ web/src/pages/api/token.ts - FILE NOT FOUND"
    exit 1
fi

echo ""
echo "✅ All files validated successfully!"
echo ""
echo "📝 Documentation files created:"
if [ -f "DEBUG_TESTING_GUIDE.md" ]; then
    echo "  ✓ DEBUG_TESTING_GUIDE.md"
else
    echo "  ✗ DEBUG_TESTING_GUIDE.md - MISSING"
fi

if [ -f "CHANGES_SUMMARY.md" ]; then
    echo "  ✓ CHANGES_SUMMARY.md"
else
    echo "  ✗ CHANGES_SUMMARY.md - MISSING"
fi

echo ""
echo "🎉 Validation complete! All changes are in place."
echo ""
echo "Next steps:"
echo "1. Ensure NEXTAUTH_SECRET is identical in backend/.env and web/.env.local"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start web: cd web && npm run dev"
echo "4. Test authentication flow and observe debug logs"
echo ""
