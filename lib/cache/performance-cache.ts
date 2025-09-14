'use client'

// 간단한 메모리 캐시 구현
class PerformanceCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()
  private maxSize = 100 // 최대 캐시 항목 수

  set(key: string, data: unknown, ttlMs: number = 5 * 60 * 1000) { // 기본 5분
    // 캐시 크기 제한
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }

    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // 깊은 복사
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    // TTL 확인
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return JSON.parse(JSON.stringify(item.data)) // 깊은 복사
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  // 패턴에 따른 삭제
  deletePattern(pattern: string) {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  // 캐시 통계
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    }
  }
}

// 전역 캐시 인스턴스
export const performanceCache = new PerformanceCache()

// 캐시 키 생성 헬퍼
export const createCacheKey = (prefix: string, ...params: unknown[]) => {
  return `${prefix}:${params.join(':')}`
}

// 캐시된 함수 실행 헬퍼
export const withCache = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs?: number
): Promise<T> => {
  // 캐시에서 확인
  const cached = performanceCache.get(key)
  if (cached) {
    console.log(`[Cache] Hit: ${key}`)
    return cached
  }

  // 캐시 미스 - 함수 실행
  console.log(`[Cache] Miss: ${key}`)
  const result = await fn()
  
  // 결과 캐시
  performanceCache.set(key, result, ttlMs)
  return result
}

// 사용자별 캐시 키 생성
export const createUserCacheKey = (userId: string, resource: string, ...params: unknown[]) => {
  return createCacheKey(`user:${userId}:${resource}`, ...params)
}

// 캐시 무효화 패턴들
export const invalidateUserCache = (userId: string) => {
  performanceCache.deletePattern(`user:${userId}:`)
}

export const invalidateSiteCache = (siteId: string) => {
  performanceCache.deletePattern(`:site:${siteId}`)
}

// 초기화 시 캐시 클리어 (페이지 새로고침 시)
if (typeof window !== 'undefined') {
  // 페이지 언로드 시 캐시 정리
  window.addEventListener('beforeunload', () => {
    performanceCache.clear()
  })
}