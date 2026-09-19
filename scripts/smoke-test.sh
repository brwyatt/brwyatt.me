#!/usr/bin/env bash
set -euo pipefail

TARGET_URL="${1:-http://localhost:3000}"

echo "=== Running synthetic smoke tests against: ${TARGET_URL} ==="

# 1. Health / Reachability check
echo -n "Checking root HTTP response... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${TARGET_URL}")
if [[ "$HTTP_CODE" =~ ^(200|301|302)$ ]]; then
  echo "PASS (HTTP ${HTTP_CODE})"
else
  echo "FAIL (Received HTTP ${HTTP_CODE})"
  exit 1
fi

# 2. Content verification
echo -n "Checking for primary brand element... "
CONTENT=$(curl -sL "${TARGET_URL}")
if echo "$CONTENT" | grep -q "Bryan Wyatt"; then
  echo "PASS"
else
  echo "FAIL (Brand string 'Bryan Wyatt' not found in response)"
  exit 1
fi

# 3. Security headers check (for HTTPS endpoints)
if [[ "${TARGET_URL}" =~ ^https:// ]]; then
  echo -n "Verifying HSTS header... "
  if curl -s -I "${TARGET_URL}" | grep -iq "strict-transport-security"; then
    echo "PASS"
  else
    echo "WARN (HSTS header missing - verify CloudFront response header policy)"
  fi
fi

echo "=== All smoke tests passed successfully! ==="
