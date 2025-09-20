#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-"http://localhost:3000"}

for TYPE in personal shared; do
  curl -sSf "${BASE_URL}/api/documents?type=${TYPE}&limit=5"
  echo
  echo "----"
  sleep 1

done
