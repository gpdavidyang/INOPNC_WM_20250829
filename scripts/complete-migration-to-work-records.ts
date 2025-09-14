
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function completeMigration() {
  console.log('🚀 attendance_records를 work_records로 최종 마이그레이션 시작...')

  try {
    // 1. daily_reports에 notes 컬럼 추가는 별도 마이그레이션으로 처리
    // (이미 테이블 구조가 정의되어 있을 것으로 가정)

    // 2. 아직 마이그레이션되지 않은 attendance_records 조회
    const { data: unmigrated, error: fetchError } = await supabase
      .from('attendance_records')
      .select('*')
      .order('work_date', { ascending: true })

    if (fetchError) {
      console.error('❌ attendance_records 조회 실패:', fetchError)
      return
    }

    console.log(`📊 전체 attendance_records: ${unmigrated?.length || 0}건`)

    // 3. 이미 마이그레이션된 데이터 확인
    const { data: existing } = await supabase
      .from('work_records')
      .select('user_id, work_date, site_id')

    const existingKeys = new Set(
      existing?.map(r => `${r.user_id}_${r.work_date}_${r.site_id}`) || []
    )

    let successCount = 0
    let skipCount = 0
    let errorCount = 0
    const errors: any[] = []

    // 4. 각 레코드 마이그레이션
    for (const record of unmigrated || []) {
      const key = `${record.user_id}_${record.work_date}_${record.site_id}`
      
      // 이미 존재하는 경우 스킵
      if (existingKeys.has(key)) {
        skipCount++
        continue
      }

      // 유효한 사용자인지 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', record.user_id)
        .single()

      if (!profile) {
        console.log(`⚠️ 유효하지 않은 사용자 ID: ${record.user_id}`)
        errorCount++
        errors.push({ user_id: record.user_id, reason: 'Invalid user' })
        continue
      }

      // daily_report 찾기 또는 생성 (선택적)
      let dailyReportId = null
      
      // 기존 daily_report 찾기
      const { data: existingReport } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('work_date', record.work_date)
        .eq('site_id', record.site_id || '00000000-0000-0000-0000-000000000000')
        .single()

      if (existingReport) {
        dailyReportId = existingReport.id
      }

      // work_records에 삽입
      const { error: insertError } = await supabase
        .from('work_records')
        .insert({
          daily_report_id: dailyReportId,
          profile_id: record.user_id,
          user_id: record.user_id,
          work_date: record.work_date,
          site_id: record.site_id || null,
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time,
          work_hours: record.work_hours,
          labor_hours: record.labor_hours || 1.0,
          overtime_hours: record.overtime_hours || 0,
          status: record.status || 'present',
          notes: record.notes,
          is_present: record.status === 'present',
          created_at: record.created_at,
          updated_at: record.updated_at || record.created_at
        })

      if (insertError) {
        errorCount++
        errors.push({ 
          user_id: record.user_id, 
          work_date: record.work_date,
          error: insertError.message 
        })
      } else {
        successCount++
      }
    }

    // 5. 결과 요약
    console.log('\n📊 최종 마이그레이션 결과:')
    console.log(`✅ 성공: ${successCount}건`)
    console.log(`⏭️ 스킵 (이미 존재): ${skipCount}건`)
    console.log(`❌ 실패: ${errorCount}건`)
    console.log(`📋 총 처리: ${unmigrated?.length || 0}건`)

    if (errors.length > 0) {
      console.log('\n❌ 실패한 레코드 요약:')
      const errorSummary = errors.reduce((acc, err) => {
        const reason = err.reason || err.error || 'Unknown'
        acc[reason] = (acc[reason] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      Object.entries(errorSummary).forEach(([reason, count]) => {
        console.log(`   ${reason}: ${count}건`)
      })
    }

    // 6. 최종 데이터 검증
    const { data: finalCount } = await supabase
      .from('work_records')
      .select('id', { count: 'exact', head: true })

    console.log(`\n✅ work_records 테이블 총 레코드: ${finalCount || 0}건`)

  } catch (error) {
    console.error('❌ 마이그레이션 중 예기치 않은 오류:', error)
  }
}

completeMigration().catch(console.error)