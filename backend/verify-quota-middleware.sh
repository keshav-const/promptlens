#!/bin/bash

# Verification script to ensure checkQuota middleware is only on /api/optimize endpoint

echo "🔍 Verifying quota middleware placement..."
echo ""

# Count how many route files import checkQuota
IMPORT_COUNT=$(grep -r "import.*checkQuota" backend/src/routes/ --include="*.ts" | wc -l)

# Count how many route files use checkQuota in route definitions
USAGE_COUNT=$(grep -r "checkQuota" backend/src/routes/ --include="*.ts" | grep -v "import" | grep -v "//" | wc -l)

echo "Files importing checkQuota: $IMPORT_COUNT"
echo "Files using checkQuota in routes: $USAGE_COUNT"
echo ""

# Show where checkQuota is used
echo "📍 checkQuota usage locations:"
grep -rn "checkQuota" backend/src/routes/ --include="*.ts" | grep -v "//" | grep -v "test"
echo ""

# Verify it's only in optimize.routes.ts
if [ "$IMPORT_COUNT" -eq 1 ] && [ "$USAGE_COUNT" -eq 1 ]; then
    LOCATION=$(grep -r "checkQuota" backend/src/routes/ --include="*.ts" | grep -v "//" | grep "router\.")
    if echo "$LOCATION" | grep -q "optimize.routes.ts"; then
        echo "✅ SUCCESS: checkQuota is only on /api/optimize endpoint"
        exit 0
    else
        echo "❌ ERROR: checkQuota is not on optimize endpoint!"
        exit 1
    fi
else
    echo "❌ ERROR: checkQuota is used in multiple places!"
    echo "   Expected: 1 file (optimize.routes.ts)"
    echo "   Found: $IMPORT_COUNT imports, $USAGE_COUNT usages"
    exit 1
fi
