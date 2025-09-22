#!/bin/bash

# Test script for photo-grids API endpoint
# Run this script to test both local and production endpoints

echo "=== Photo Grid API Test Script ==="
echo ""

# Test local endpoint
echo "1. Testing LOCAL endpoint (http://localhost:3000/api/photo-grids):"
echo "-------------------------------------------------------------"
curl -X POST http://localhost:3000/api/photo-grids \
  -H "Content-Type: multipart/form-data" \
  -F "site_id=test" \
  -F "component_name=test" \
  -F "work_process=test" \
  -F "work_section=test" \
  -F "work_date=2024-01-01" \
  -v 2>&1 | grep -E "< HTTP|401|404|500|200"

echo ""
echo ""

# Test production endpoint
echo "2. Testing PRODUCTION endpoint (https://inopnc-wm-20250829.vercel.app/api/photo-grids):"
echo "-------------------------------------------------------------------------"
curl -X POST https://inopnc-wm-20250829.vercel.app/api/photo-grids \
  -H "Content-Type: multipart/form-data" \
  -F "site_id=test" \
  -F "component_name=test" \
  -F "work_process=test" \
  -F "work_section=test" \
  -F "work_date=2024-01-01" \
  -v 2>&1 | grep -E "< HTTP|401|404|500|200"

echo ""
echo ""

# Test OPTIONS (CORS preflight)
echo "3. Testing OPTIONS (CORS preflight) on PRODUCTION:"
echo "----------------------------------------------------"
curl -X OPTIONS https://inopnc-wm-20250829.vercel.app/api/photo-grids \
  -H "Origin: https://inopnc-wm-20250829.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "< HTTP|< Access-Control"

echo ""
echo ""

# Test GET endpoint (should work)
echo "4. Testing GET endpoint on PRODUCTION (as control test):"
echo "----------------------------------------------------------"
curl -X GET https://inopnc-wm-20250829.vercel.app/api/photo-grids \
  -v 2>&1 | grep -E "< HTTP|401|404|500|200"

echo ""
echo "=== Test Complete ==="
echo ""
echo "Expected results:"
echo "- Local POST: Should return 401 (Unauthorized)"
echo "- Production POST: Should return 401 (not 404)"
echo "- OPTIONS: Should return 200 with CORS headers"
echo "- GET: Should return 401 (Unauthorized)"