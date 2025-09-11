import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function migrateAttendanceToWorkers() {
  console.log('🚀 attendance_records를 worker_assignments로 마이그레이션 시작...')

  try {
    // 1. attendance_records의 모든 데이터 조회
    const { data: attendanceRecords, error: fetchError } = await supabase
      .from('attendance_records')
      .select('*')
      .order('work_date', { ascending: true })

    if (fetchError) {
      console.error('❌ attendance_records 조회 실패:', fetchError)
      return
    }

    console.log(`✅ 총 ${attendanceRecords?.length || 0}개의 attendance_records 발견`)

    if (!attendanceRecords || attendanceRecords.length === 0) {
      console.log('ℹ️ 마이그레이션할 데이터가 없습니다.')
      return
    }

    // 2. 각 attendance_record를 worker_assignment로 변환
    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const record of attendanceRecords) {
      // 중복 체크: 같은 user_id, work_date, site_id가 이미 있는지 확인
      const { data: existing } = await supabase
        .from('worker_assignments')
        .select('id')
        .eq('user_id', record.user_id)
        .eq('work_date', record.work_date)
        .eq('site_id', record.site_id)
        .single()

      if (existing) {
        console.log(`⏭️ 이미 존재: ${record.work_date} - User: ${record.user_id}`)
        skipCount++
        continue
      }

      // daily_report 찾기 또는 생성
      let dailyReportId = null

      // 먼저 해당 날짜와 사이트의 daily_report가 있는지 확인
      const { data: existingReport } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('work_date', record.work_date)
        .eq('site_id', record.site_id)
        .single()

      if (existingReport) {
        dailyReportId = existingReport.id
      } else {
        // daily_report가 없으면 생성
        const { data: newReport, error: reportError } = await supabase
          .from('daily_reports')
          .insert({
            work_date: record.work_date,
            site_id: record.site_id,
            status: 'submitted',
            notes: `Migrated from attendance_records on ${new Date().toISOString()}`
          })
          .select()
          .single()

        if (reportError) {
          console.error(`❌ Daily report 생성 실패 (${record.work_date}):`, reportError)
          errorCount++
          continue
        }

        dailyReportId = newReport.id
      }

      // worker_assignment 생성
      const { error: insertError } = await supabase
        .from('worker_assignments')
        .insert({
          daily_report_id: dailyReportId,
          profile_id: record.user_id,
          user_id: record.user_id,
          work_date: record.work_date,
          site_id: record.site_id,
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time,
          work_hours: record.work_hours,
          labor_hours: record.labor_hours || 1.0,  // 기본값 1.0 공수
          overtime_hours: record.overtime_hours || 0,
          status: record.status || 'present',
          notes: record.notes,
          is_present: record.status === 'present',
          created_at: record.created_at,
          updated_at: record.updated_at || record.created_at
        })

      if (insertError) {
        console.error(`❌ 마이그레이션 실패 (${record.work_date}):`, insertError)
        errorCount++
      } else {
        successCount++
        console.log(`✅ 마이그레이션 성공: ${record.work_date} - User: ${record.user_id}`)
      }
    }

    // 3. 결과 요약
    console.log('\n📊 마이그레이션 완료:')
    console.log(`✅ 성공: ${successCount}건`)
    console.log(`⏭️ 스킵 (이미 존재): ${skipCount}건`)
    console.log(`❌ 실패: ${errorCount}건`)
    console.log(`📋 총 처리: ${attendanceRecords.length}건`)

    // 4. 검증: 마이그레이션된 데이터 확인
    const { data: verifyData, error: verifyError } = await supabase
      .from('worker_assignments')
      .select('work_date, user_id, site_id')
      .gte('work_date', '2025-06-01')
      .lte('work_date', '2025-08-31')

    if (!verifyError && verifyData) {
      console.log(`\n✅ 검증: 2025년 6-8월 worker_assignments 데이터 ${verifyData.length}건 확인`)
    }

  } catch (error) {
    console.error('❌ 마이그레이션 중 예기치 않은 오류:', error)
  }
}

migrateAttendanceToWorkers().catch(console.error)