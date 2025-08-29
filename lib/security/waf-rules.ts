/**
 * Web Application Firewall (WAF) Rules Configuration
 * 
 * Implements protection against common web application attacks:
 * - SQL Injection
 * - Cross-Site Scripting (XSS)
 * - Command Injection
 * - Path Traversal
 * - LDAP Injection
 * - NoSQL Injection
 * - Server-Side Request Forgery (SSRF)
 * - XML External Entity (XXE)
 */

import { NextRequest } from 'next/server'
import { logSecurityEvent } from './security-headers'

export interface WAFRule {
  id: string
  name: string
  description: string
  pattern: RegExp
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'log' | 'block' | 'challenge'
  category: 'sqli' | 'xss' | 'lfi' | 'rfi' | 'cmdi' | 'xxe' | 'ssrf' | 'nosql'
}

// SQL Injection Detection Rules
const SQL_INJECTION_RULES: WAFRule[] = [
  {
    id: 'SQLI_001',
    name: 'SQL Injection - Union Attack',
    description: 'Detects UNION-based SQL injection attempts',
    pattern: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(union|select|from|where|order|group)\b)/gi,
    severity: 'critical',
    action: 'block',
    category: 'sqli'
  },
  {
    id: 'SQLI_002',
    name: 'SQL Injection - Comment Injection',
    description: 'Detects SQL comment injection attempts',
    pattern: /('|(\/\*)|(\*\/)|(\-\-)|(\#))/gi,
    severity: 'high',
    action: 'block',
    category: 'sqli'
  },
  {
    id: 'SQLI_003',
    name: 'SQL Injection - Boolean-based',
    description: 'Detects boolean-based blind SQL injection',
    pattern: /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    severity: 'high',
    action: 'block',
    category: 'sqli'
  },
  {
    id: 'SQLI_004',
    name: 'SQL Injection - Time-based',
    description: 'Detects time-based blind SQL injection',
    pattern: /\b(waitfor|delay|sleep|benchmark)\b.*\(/gi,
    severity: 'high',
    action: 'block',
    category: 'sqli'
  }
]

// Cross-Site Scripting (XSS) Detection Rules
const XSS_RULES: WAFRule[] = [
  {
    id: 'XSS_001',
    name: 'XSS - Script Tag Injection',
    description: 'Detects script tag injection attempts',
    pattern: /<script[^>]*>.*?<\/script>/gi,
    severity: 'critical',
    action: 'block',
    category: 'xss'
  },
  {
    id: 'XSS_002',
    name: 'XSS - Event Handler Injection',
    description: 'Detects event handler injection attempts',
    pattern: /\bon\w+\s*=\s*["\']?[^"'\s>]*javascript:/gi,
    severity: 'high',
    action: 'block',
    category: 'xss'
  },
  {
    id: 'XSS_003',
    name: 'XSS - JavaScript URI',
    description: 'Detects javascript: URI injection',
    pattern: /javascript\s*:/gi,
    severity: 'high',
    action: 'block',
    category: 'xss'
  },
  {
    id: 'XSS_004',
    name: 'XSS - Expression Injection',
    description: 'Detects CSS expression injection',
    pattern: /expression\s*\(/gi,
    severity: 'medium',
    action: 'block',
    category: 'xss'
  },
  {
    id: 'XSS_005',
    name: 'XSS - Data URI',
    description: 'Detects malicious data URI injection',
    pattern: /data\s*:\s*text\/html/gi,
    severity: 'medium',
    action: 'block',
    category: 'xss'
  }
]

// Local File Inclusion (LFI) / Path Traversal Rules
const LFI_RULES: WAFRule[] = [
  {
    id: 'LFI_001',
    name: 'Path Traversal - Directory Traversal',
    description: 'Detects directory traversal attempts',
    pattern: /(\.\.[\/\\]){3,}/gi,
    severity: 'high',
    action: 'block',
    category: 'lfi'
  },
  {
    id: 'LFI_002',
    name: 'Path Traversal - Unix Paths',
    description: 'Detects Unix path traversal attempts',
    pattern: /(\/etc\/passwd|\/etc\/shadow|\/proc\/|\/dev\/)/gi,
    severity: 'critical',
    action: 'block',
    category: 'lfi'
  },
  {
    id: 'LFI_003',
    name: 'Path Traversal - Windows Paths',
    description: 'Detects Windows path traversal attempts',
    pattern: /(boot\.ini|win\.ini|system32)/gi,
    severity: 'high',
    action: 'block',
    category: 'lfi'
  }
]

// Command Injection Rules
const COMMAND_INJECTION_RULES: WAFRule[] = [
  {
    id: 'CMDI_001',
    name: 'Command Injection - Basic Commands',
    description: 'Detects basic command injection attempts',
    pattern: /(\||;|&|`|\$\(|\$\{|<|>)/gi,
    severity: 'high',
    action: 'block',
    category: 'cmdi'
  },
  {
    id: 'CMDI_002',
    name: 'Command Injection - System Commands',
    description: 'Detects system command injection attempts',
    pattern: /\b(cat|ls|ps|id|pwd|uname|whoami|netstat|ifconfig|ping|curl|wget)\b/gi,
    severity: 'critical',
    action: 'block',
    category: 'cmdi'
  }
]

// NoSQL Injection Rules
const NOSQL_INJECTION_RULES: WAFRule[] = [
  {
    id: 'NOSQL_001',
    name: 'NoSQL Injection - MongoDB Operators',
    description: 'Detects MongoDB injection attempts',
    pattern: /(\$ne|\$eq|\$gt|\$lt|\$in|\$nin|\$and|\$or|\$not|\$exists|\$regex)/gi,
    severity: 'high',
    action: 'block',
    category: 'nosql'
  },
  {
    id: 'NOSQL_002',
    name: 'NoSQL Injection - JavaScript Evaluation',
    description: 'Detects NoSQL JavaScript injection',
    pattern: /(\$where|\$eval|mapreduce|group)/gi,
    severity: 'critical',
    action: 'block',
    category: 'nosql'
  }
]

// Server-Side Request Forgery (SSRF) Rules
const SSRF_RULES: WAFRule[] = [
  {
    id: 'SSRF_001',
    name: 'SSRF - Internal IP Addresses',
    description: 'Detects attempts to access internal IP addresses',
    pattern: /(127\.0\.0\.1|localhost|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/gi,
    severity: 'high',
    action: 'block',
    category: 'ssrf'
  },
  {
    id: 'SSRF_002',
    name: 'SSRF - Cloud Metadata',
    description: 'Detects attempts to access cloud metadata services',
    pattern: /(169\.254\.169\.254|metadata\.google\.internal|metadata\.aws\.amazon\.com)/gi,
    severity: 'critical',
    action: 'block',
    category: 'ssrf'
  }
]

// XML External Entity (XXE) Rules
const XXE_RULES: WAFRule[] = [
  {
    id: 'XXE_001',
    name: 'XXE - External Entity Declaration',
    description: 'Detects XML external entity declarations',
    pattern: /<!ENTITY.*SYSTEM/gi,
    severity: 'critical',
    action: 'block',
    category: 'xxe'
  },
  {
    id: 'XXE_002',
    name: 'XXE - DOCTYPE Declaration',
    description: 'Detects suspicious DOCTYPE declarations',
    pattern: /<!DOCTYPE[^>]*\[.*ENTITY/gi,
    severity: 'high',
    action: 'block',
    category: 'xxe'
  }
]

// Combine all rules
export const WAF_RULES: WAFRule[] = [
  ...SQL_INJECTION_RULES,
  ...XSS_RULES,
  ...LFI_RULES,
  ...COMMAND_INJECTION_RULES,
  ...NOSQL_INJECTION_RULES,
  ...SSRF_RULES,
  ...XXE_RULES
]

// WAF Engine
export class WAFEngine {
  private rules: WAFRule[]
  private enabled: boolean

  constructor(rules: WAFRule[] = WAF_RULES, enabled = true) {
    this.rules = rules
    this.enabled = enabled
  }

  /**
   * Analyze request for potential attacks
   */
  async analyzeRequest(request: NextRequest): Promise<{
    blocked: boolean
    violations: WAFViolation[]
    risk_score: number
  }> {
    if (!this.enabled) {
      return { blocked: false, violations: [], risk_score: 0 }
    }

    const violations: WAFViolation[] = []
    let risk_score = 0

    // Get request data
    const url = request.nextUrl.toString()
    const headers = Object.fromEntries(request.headers.entries())
    
    let body = ''
    try {
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        body = await request.clone().text()
      }
    } catch (error) {
      // Ignore body parsing errors
    }

    // Combine all request data for analysis
    const requestData = [
      url,
      JSON.stringify(headers),
      body,
      request.nextUrl.search
    ].join(' ')

    // Check each rule against request data
    for (const rule of this.rules) {
      if (rule.pattern.test(requestData)) {
        const violation: WAFViolation = {
          rule_id: rule.id,
          rule_name: rule.name,
          description: rule.description,
          severity: rule.severity,
          category: rule.category,
          matched_data: this.extractMatchedData(requestData, rule.pattern),
          timestamp: new Date().toISOString()
        }

        violations.push(violation)

        // Calculate risk score
        const severityScores = { low: 1, medium: 3, high: 7, critical: 10 }
        risk_score += severityScores[rule.severity]

        // Log security event
        logSecurityEvent({
          type: 'suspicious_activity',
          severity: rule.severity,
          ip: this.getClientIP(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          timestamp: violation.timestamp,
          details: {
            waf_violation: violation,
            url: request.nextUrl.pathname,
            method: request.method
          }
        })
      }
    }

    // Determine if request should be blocked
    const blocked = violations.some(v => 
      this.rules.find(r => r.id === v.rule_id)?.action === 'block'
    ) || risk_score >= 15

    return { blocked, violations, risk_score }
  }

  /**
   * Extract matched data from pattern (limited for security)
   */
  private extractMatchedData(data: string, pattern: RegExp): string {
    const matches = data.match(pattern)
    if (!matches) return ''
    
    // Limit to first 100 characters and sanitize
    return matches[0].substring(0, 100).replace(/[<>"/]/g, '_')
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           'unknown'
  }

  /**
   * Create blocked response
   */
  createBlockedResponse(violations: WAFViolation[]): Response {
    return new Response(
      JSON.stringify({
        error: 'Request blocked by Web Application Firewall',
        reference_id: crypto.randomUUID(),
        blocked_at: new Date().toISOString()
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-WAF-Blocked': 'true',
          'X-WAF-Rule-Count': violations.length.toString()
        }
      }
    )
  }

  /**
   * Enable/disable WAF
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Add custom rule
   */
  addRule(rule: WAFRule): void {
    this.rules.push(rule)
  }

  /**
   * Remove rule by ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId)
  }
}

export interface WAFViolation {
  rule_id: string
  rule_name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  matched_data: string
  timestamp: string
}

// Export singleton instance
let wafInstance: WAFEngine | null = null

export function getWAFEngine(): WAFEngine {
  if (!wafInstance) {
    wafInstance = new WAFEngine()
  }
  return wafInstance
}

/**
 * WAF middleware for Next.js
 */
export async function withWAF(request: NextRequest): Promise<Response | null> {
  const waf = getWAFEngine()
  const analysis = await waf.analyzeRequest(request)
  
  if (analysis.blocked) {
    return waf.createBlockedResponse(analysis.violations)
  }
  
  return null
}

/**
 * WAF configuration for different environments
 */
export const WAF_CONFIG = {
  production: {
    enabled: true,
    strict_mode: true,
    log_all_violations: true,
    block_threshold: 10
  },
  staging: {
    enabled: true,
    strict_mode: false,
    log_all_violations: true,
    block_threshold: 15
  },
  development: {
    enabled: false,
    strict_mode: false,
    log_all_violations: false,
    block_threshold: 20
  }
}