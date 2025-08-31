#!/usr/bin/env tsx

/**
 * 문서 시스템 마이그레이션 스크립트
 * 
 * 사용법:
 * npm run migrate:documents -- --env=development
 * npm run migrate:documents -- --env=production --backup
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs/promises'
import path from 'path'

interface MigrationConfig {
  env: 'development' | 'production'
  backup: boolean
  dryRun: boolean
  verbose: boolean
}

class DocumentMigrationManager {
  private supabase: any
  private config: MigrationConfig

  constructor(config: MigrationConfig) {
    this.config = config
    
    // 환경별 Supabase 클라이언트 설정
    const supabaseUrl = config.env === 'production' 
      ? process.env.NEXT_PUBLIC_SUPABASE_URL 
      : process.env.NEXT_PUBLIC_SUPABASE_URL

    const supabaseKey = config.env === 'production'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다.')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async run() {
    console.log(`🚀 문서 시스템 마이그레이션 시작 (${this.config.env})`)
    console.log(`설정: ${JSON.stringify(this.config, null, 2)}`)

    try {
      // Phase 1: 준비 단계
      await this.createBackups()
      await this.validatePrerequisites()
      
      // Phase 2: 마이그레이션 실행
      if (!this.config.dryRun) {
        await this.createUnifiedTable()
        await this.migrateData()
        await this.validateMigration()
      } else {
        console.log('🔍 DRY RUN 모드: 실제 마이그레이션은 실행되지 않습니다.')
        await this.analyzeData()
      }
      
      console.log('✅ 마이그레이션이 성공적으로 완료되었습니다.')
      
    } catch (error) {
      console.error('❌ 마이그레이션 실패:', error)
      
      if (!this.config.dryRun) {
        console.log('🔄 롤백을 시작합니다...')
        await this.rollback()
      }
      
      process.exit(1)
    }
  }

  private async createBackups() {
    if (!this.config.backup) {
      console.log('⚠️  백업 생성을 건너뜁니다.')
      return
    }

    console.log('📦 백업을 생성하는 중...')

    const tables = ['documents', 'unified_documents', 'markup_documents', 'user_documents']
    
    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('*')

        if (error) {
          console.warn(`⚠️  ${table} 백업 생성 실패:`, error.message)
          continue
        }

        const backupDir = path.join(process.cwd(), 'backups', 'documents')
        await fs.mkdir(backupDir, { recursive: true })

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupFile = path.join(backupDir, `${table}_backup_${timestamp}.json`)
        
        await fs.writeFile(backupFile, JSON.stringify(data, null, 2))
        console.log(`✅ ${table} 백업 완료: ${backupFile}`)
        
      } catch (error) {
        console.error(`❌ ${table} 백업 실패:`, error)
        throw error
      }
    }
  }

  private async validatePrerequisites() {
    console.log('🔍 사전 조건을 확인하는 중...')

    // 필수 테이블 존재 확인
    const requiredTables = ['documents', 'unified_documents', 'markup_documents', 'user_documents']
    
    for (const table of requiredTables) {
      const { data, error } = await this.supabase
        .from(table)
        .select('count', { count: 'exact', head: true })

      if (error) {
        throw new Error(`필수 테이블 ${table}이 존재하지 않습니다: ${error.message}`)
      }
    }

    // 통합 테이블이 이미 존재하는지 확인
    const { data: existingTable } = await this.supabase
      .from('unified_document_system')
      .select('count', { count: 'exact', head: true })

    if (existingTable !== null) {
      console.log('⚠️  통합 테이블이 이미 존재합니다. 기존 데이터를 확인해주세요.')
    }

    console.log('✅ 사전 조건 확인 완료')
  }

  private async createUnifiedTable() {
    console.log('🏗️  통합 테이블을 생성하는 중...')

    try {
      const migrationSql = await fs.readFile(
        path.join(process.cwd(), 'migrations', '001_create_unified_document_system.sql'),
        'utf-8'
      )

      // SQL 스크립트를 세미콜론으로 분리하여 실행
      const statements = migrationSql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      for (const statement of statements) {
        const { error } = await this.supabase.rpc('exec_sql', {
          sql: statement
        })

        if (error) {
          console.error('SQL 실행 오류:', error)
          throw error
        }
      }

      console.log('✅ 통합 테이블 생성 완료')
      
    } catch (error) {
      console.error('❌ 통합 테이블 생성 실패:', error)
      throw error
    }
  }

  private async migrateData() {
    console.log('📥 데이터 마이그레이션을 시작합니다...')

    try {
      const migrationSql = await fs.readFile(
        path.join(process.cwd(), 'migrations', '002_migrate_documents_data.sql'),
        'utf-8'
      )

      // 마이그레이션 SQL 실행
      const { error } = await this.supabase.rpc('exec_sql', {
        sql: migrationSql
      })

      if (error) {
        console.error('마이그레이션 SQL 실행 오류:', error)
        throw error
      }

      console.log('✅ 데이터 마이그레이션 완료')
      
    } catch (error) {
      console.error('❌ 데이터 마이그레이션 실패:', error)
      throw error
    }
  }

  private async validateMigration() {
    console.log('🔍 마이그레이션 결과를 검증하는 중...')

    try {
      // 마이그레이션 통계 조회
      const { data: stats, error } = await this.supabase
        .rpc('verify_migration_completeness')

      if (error) {
        throw new Error(`검증 쿼리 실행 실패: ${error.message}`)
      }

      console.log('📊 마이그레이션 통계:')
      console.table(stats)

      // 불완전한 마이그레이션 확인
      const incompleteMigrations = stats?.filter((stat: any) => !stat.migration_complete)
      
      if (incompleteMigrations && incompleteMigrations.length > 0) {
        console.error('❌ 불완전한 마이그레이션 발견:')
        console.table(incompleteMigrations)
        throw new Error('마이그레이션이 불완전합니다.')
      }

      // 데이터 샘플링 검증
      await this.validateDataSamples()

      console.log('✅ 마이그레이션 검증 완료')
      
    } catch (error) {
      console.error('❌ 마이그레이션 검증 실패:', error)
      throw error
    }
  }

  private async validateDataSamples() {
    console.log('🔍 데이터 샘플을 검증하는 중...')

    // 각 카테고리별 샘플 문서 확인
    const categories = ['shared', 'markup', 'required', 'invoice', 'photo_grid']
    
    for (const category of categories) {
      const { data: samples, error } = await this.supabase
        .from('unified_document_system')
        .select('*')
        .eq('category_type', category)
        .limit(5)

      if (error) {
        console.warn(`⚠️  ${category} 카테고리 샘플 조회 실패:`, error.message)
        continue
      }

      console.log(`📄 ${category} 카테고리: ${samples?.length || 0}개 문서`)
      
      if (this.config.verbose && samples) {
        samples.forEach((doc: any) => {
          console.log(`  - ${doc.title} (${doc.legacy_table})`)
        })
      }
    }
  }

  private async analyzeData() {
    console.log('📊 현재 데이터를 분석하는 중...')

    const tables = ['documents', 'unified_documents', 'markup_documents', 'user_documents']
    
    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.warn(`⚠️  ${table} 분석 실패:`, error.message)
          continue
        }

        console.log(`📊 ${table}: ${data} 레코드`)
        
      } catch (error) {
        console.error(`❌ ${table} 분석 오류:`, error)
      }
    }
  }

  private async rollback() {
    console.log('🔄 롤백을 실행하는 중...')

    try {
      const { error } = await this.supabase.rpc('rollback_document_migration')
      
      if (error) {
        console.error('롤백 실행 오류:', error)
        throw error
      }

      console.log('✅ 롤백 완료')
      
    } catch (error) {
      console.error('❌ 롤백 실패:', error)
      throw error
    }
  }
}

// CLI 인터페이스
async function main() {
  const args = process.argv.slice(2)
  
  const config: MigrationConfig = {
    env: 'development',
    backup: false,
    dryRun: false,
    verbose: false
  }

  // 인자 파싱
  args.forEach(arg => {
    if (arg.startsWith('--env=')) {
      config.env = arg.split('=')[1] as 'development' | 'production'
    } else if (arg === '--backup') {
      config.backup = true
    } else if (arg === '--dry-run') {
      config.dryRun = true
    } else if (arg === '--verbose') {
      config.verbose = true
    }
  })

  // 프로덕션 환경에서는 백업 강제
  if (config.env === 'production') {
    config.backup = true
  }

  const migrationManager = new DocumentMigrationManager(config)
  await migrationManager.run()
}

// 스크립트 직접 실행 시에만 main 함수 호출
if (require.main === module) {
  main().catch(error => {
    console.error('스크립트 실행 실패:', error)
    process.exit(1)
  })
}

export { DocumentMigrationManager, type MigrationConfig }