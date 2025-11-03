#!/usr/bin/env node

/**
 * Minimal HTTP client using Node's built-in http module to PATCH a daily report.
 * Usage:
 *   node scripts/clients/daily-report-patch.js <id> '{"site_id": "...", "work_date": "..."}'
 */

const http = require('http')

function main() {
  const [id, bodyRaw] = process.argv.slice(2)
  if (!id || !bodyRaw) {
    console.error('Usage: node daily-report-patch.js <id> <json-body>')
    process.exit(1)
  }

  let payload
  try {
    payload = JSON.parse(bodyRaw)
  } catch (err) {
    console.error('Invalid JSON payload:', err.message)
    process.exit(1)
  }

  const data = JSON.stringify(payload)
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/admin/daily-reports/${encodeURIComponent(id)}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  }

  const req = http.request(options, res => {
    console.log('Status:', res.statusCode)
    let body = ''
    res.on('data', chunk => (body += chunk))
    res.on('end', () => console.log('Response:', body || '(empty)'))
  })

  req.on('error', err => {
    console.error('Request error:', err.message)
    process.exit(1)
  })

  req.write(data)
  req.end()
}

main()
