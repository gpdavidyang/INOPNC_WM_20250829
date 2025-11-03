#!/bin/bash
curl -s -X PATCH http://localhost:3000/api/admin/daily-reports/2d1e96de-2ecb-46a4-878b-7a026a13ae36 -H 'Content-Type: application/json' -d '{}'
