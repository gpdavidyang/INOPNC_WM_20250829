/**
 * Supabase 타입 확장
 * Supabase 생성 타입과 실제 데이터베이스 스키마 불일치 문제 해결
 */

import { SupabaseClient } from '@supabase/supabase-js'

declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    // 동적 테이블 이름을 허용하는 from 메서드 오버로드
    from(table: string): any
  }
}

// 데이터베이스에 존재하지만 타입 생성에서 누락된 테이블들
declare global {
  interface Database {
    public: {
      Tables: {
        // 백업 관련 테이블
        backup_configs: any
        backup_jobs: any
        backup_schedules: any
        
        // 주소 관련 테이블
        site_addresses: any
        accommodation_addresses: any
        
        // 기타 누락된 테이블들
        materials: any
        material_stocks: any
        material_transactions: any
        material_requests: any
      }
    }
  }
}

export {}