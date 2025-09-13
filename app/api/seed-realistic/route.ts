import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// 현실적인 한국어 이름 매핑 (기존 사용자 → 새 이름)
const WORKER_NAME_MAPPING = [
  { role: 'worker', newName: '김철수' },
  { role: 'worker', newName: '이영호' },  
  { role: 'worker', newName: '박민수' },
  { role: 'site_manager', newName: '유현석' },
  { role: 'site_manager', newName: '임재현' },
  { role: 'site_manager', newName: '장혜진' }
] as const

export async function POST(request: NextRequest) {
  try {
    // Use service role to bypass RLS
    const serviceSupabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const results = {
      profiles_updated: 0,
      assignments: 0,
      attendance: 0,
      reports: 0,
      errors: [] as string[]
    }

    console.log('🚀 현실적인 데이터 시딩 시작...')

    // 1. 기존 사용자 이름을 현실적인 한국어 이름으로 업데이트
    const { data: existingProfiles, error: profilesError } = await serviceSupabase
      .from('profiles')
      .select('id, full_name, role, email')
      .order('role, created_at')

    if (profilesError) {
      return NextResponse.json({ error: `사용자 조회 실패: ${profilesError.message}` }, { status: 500 })
    }

    if (!existingProfiles || existingProfiles.length === 0) {
      return NextResponse.json({ error: '기존 사용자가 없습니다. 먼저 기본 사용자를 생성해주세요.' }, { status: 400 })
    }

    console.log(`👥 ${existingProfiles.length}명의 기존 사용자 발견`)

    // 역할별로 그룹화하고 현실적인 이름으로 업데이트
    const workers = existingProfiles.filter((p: any) => p.role === 'worker')
    const managers = existingProfiles.filter((p: any) => p.role === 'site_manager')
    
    let mappingIndex = 0
    
    // 작업자 이름 업데이트
    for (let i = 0; i < workers.length && mappingIndex < WORKER_NAME_MAPPING.length; i++) {
      const worker = workers[i]
      const mapping = WORKER_NAME_MAPPING.find((m: any, idx: number) => idx >= mappingIndex && m.role === 'worker')
      
      if (mapping) {
        const { error: updateError } = await serviceSupabase
          .from('profiles')
          .update({ 
            full_name: mapping.newName,
            phone: `010-${1000 + i}-${2000 + i}`
          })
          .eq('id', worker.id)

        if (updateError) {
          results.errors.push(`작업자 이름 업데이트 실패 (${worker.full_name} → ${mapping.newName}): ${updateError.message}`)
        } else {
          results.profiles_updated++
          console.log(`✅ ${worker.full_name} → ${mapping.newName}`)
        }
        mappingIndex++
      }
    }

    // 관리자 이름 업데이트  
    for (let i = 0; i < managers.length && mappingIndex < WORKER_NAME_MAPPING.length; i++) {
      const manager = managers[i]
      const mapping = WORKER_NAME_MAPPING.find((m: any, idx: number) => idx >= mappingIndex && m.role === 'site_manager')
      
      if (mapping) {
        const { error: updateError } = await serviceSupabase
          .from('profiles')
          .update({ 
            full_name: mapping.newName,
            phone: `010-${8000 + i}-${9000 + i}`
          })
          .eq('id', manager.id)

        if (updateError) {
          results.errors.push(`관리자 이름 업데이트 실패 (${manager.full_name} → ${mapping.newName}): ${updateError.message}`)
        } else {
          results.profiles_updated++
          console.log(`✅ ${manager.full_name} → ${mapping.newName}`)
        }
        mappingIndex++
      }
    }

    // 2. 활성 사이트 조회
    const { data: sites, error: sitesError } = await serviceSupabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .limit(3)

    if (sitesError || !sites || sites.length === 0) {
      return NextResponse.json({ error: '활성 사이트가 없습니다.' }, { status: 400 })
    }

    console.log(`🏗️ ${sites.length}개 활성 사이트 발견: ${sites.map((s: any) => s.name).join(', ')}`)

    // 3. 기존 사용자를 사이트에 배정 (기존 배정이 있으면 건너뜀)
    const updatedProfiles = await serviceSupabase
      .from('profiles')
      .select('id, full_name, role')
      .order('role, created_at')

    const allUsers = updatedProfiles.data || existingProfiles
    
    for (let i = 0; i < allUsers.length && i < sites.length * 3; i++) {
      const user = allUsers[i]
      const site = sites[i % sites.length] // 순환 배정

      // 기존 배정 확인
      const { data: existingAssignment } = await serviceSupabase
        .from('site_assignments')
        .select('id')
        .eq('user_id', user.id)
        .eq('site_id', site.id)
        .single()

      if (!existingAssignment) {
        const { error: assignError } = await serviceSupabase
          .from('site_assignments')
          .insert({
            user_id: user.id,
            site_id: site.id,
            assigned_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            role: user.role === 'site_manager' ? 'site_manager' : 'worker',
            is_active: true
          })

        if (assignError) {
          results.errors.push(`사용자 배정 실패 (${user.full_name} → ${site.name}): ${assignError.message}`)
        } else {
          results.assignments++
          console.log(`📋 ${user.full_name} → ${site.name}`)
        }
      }
    }

    // 4. 현실적인 출근 기록 생성 (최근 20일, 평일만)
    console.log('⏰ 출근 기록 생성 중...')
    
    for (const user of allUsers) {
      // 사용자가 배정된 사이트 찾기
      const { data: userAssignments } = await serviceSupabase
        .from('site_assignments')
        .select('site_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)

      if (!userAssignments || userAssignments.length === 0) continue

      const siteId = userAssignments[0].site_id

      for (let dayOffset = 0; dayOffset < 20; dayOffset++) {
        const workDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000)
        
        // 주말 제외
        if (workDate.getDay() === 0 || workDate.getDay() === 6) continue

        // 기존 출근 기록 확인
        const { data: existingRecord } = await serviceSupabase
          .from('attendance_records')
          .select('id')
          .eq('user_id', user.id)
          .eq('work_date', workDate.toISOString().split('T')[0])
          .single()

        if (existingRecord) continue // 이미 있으면 건너뜀

        // 현실적인 근무 패턴
        const random = Math.random()
        let laborHours: number, status: string, checkOutTime: string

        if (random < 0.05) { // 5% 결근
          continue // 출근 기록 생성하지 않음
        } else if (random < 0.15) { // 10% 반일
          laborHours = 0.5
          status = 'present' // 유효한 상태값 사용
          checkOutTime = '12:00:00'
        } else if (random < 0.25) { // 10% 연장
          laborHours = 1.25
          status = 'present'
          checkOutTime = '18:00:00'
        } else { // 75% 정상
          laborHours = 1.0
          status = 'present'
          checkOutTime = '17:00:00'
        }

        const { error: attendanceError } = await serviceSupabase
          .from('attendance_records')
          .insert({
            user_id: user.id,
            site_id: siteId,
            work_date: workDate.toISOString().split('T')[0],
            check_in_time: '08:00:00',
            check_out_time: checkOutTime,
            status: status,
            labor_hours: laborHours,
            work_hours: laborHours * 8,
            notes: laborHours === 1.25 ? '연장 근무' : laborHours === 0.5 ? '반일 근무' : '정상 근무'
          })

        if (attendanceError) {
          results.errors.push(`출근 기록 실패: ${attendanceError.message}`)
        } else {
          results.attendance++
        }
      }
    }

    // 5. 현실적인 작업일지 생성 (최근 10일, 평일만)
    console.log('📝 작업일지 생성 중...')
    
    const memberNames = ['슬라브', '기둥', '벽체', '보']
    const processTypes = ['타설', '양생', '균열검사', '면처리', '배근', '결속']

    for (const site of sites) {
      // 해당 사이트의 관리자 찾기
      const { data: siteManagers } = await serviceSupabase
        .from('site_assignments')
        .select('user_id, profiles!inner(id, full_name, role)')
        .eq('site_id', site.id)
        .eq('is_active', true)
        .eq('profiles.role', 'site_manager')
        .limit(1)

      const managerId = siteManagers && siteManagers.length > 0 ? siteManagers[0].user_id : allUsers.find((u: any) => u.role === 'site_manager')?.id

      if (!managerId) continue

      // 해당 사이트의 총 작업자 수 계산
      const { data: siteWorkers } = await serviceSupabase
        .from('site_assignments')
        .select('user_id')
        .eq('site_id', site.id)
        .eq('is_active', true)

      const totalWorkers = siteWorkers ? siteWorkers.length : 1

      for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
        const workDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000)
        
        // 주말 제외
        if (workDate.getDay() === 0 || workDate.getDay() === 6) continue

        const memberName = memberNames[Math.floor(Math.random() * memberNames.length)]
        const processType = processTypes[Math.floor(Math.random() * processTypes.length)]
        
        // 기존 작업일지 확인 (site_id, work_date, member_name, process_type의 조합으로)
        const { data: existingReport } = await serviceSupabase
          .from('daily_reports')
          .select('id')
          .eq('site_id', site.id)
          .eq('work_date', workDate.toISOString().split('T')[0])
          .eq('member_name', memberName)
          .eq('process_type', processType)
          .single()

        if (existingReport) continue

        // NPC1000 데이터 (타설/양생 시에만)
        const hasNpcData = processType === '타설' || processType === '양생'
        const npcIncoming = hasNpcData ? Math.floor(Math.random() * 30 + 10) : null
        const npcUsed = hasNpcData ? Math.floor(Math.random() * 20 + 5) : null
        const npcRemaining = hasNpcData ? Math.floor(Math.random() * 15 + 5) : null

        const { error: reportError } = await serviceSupabase
          .from('daily_reports')
          .insert({
            site_id: site.id,
            work_date: workDate.toISOString().split('T')[0],
            member_name: memberName,
            process_type: processType,
            total_workers: totalWorkers,
            npc1000_incoming: npcIncoming,
            npc1000_used: npcUsed,
            npc1000_remaining: npcRemaining,
            issues: Math.random() < 0.1 ? '날씨로 인한 작업 지연' : null,
            status: 'submitted',
            created_by: managerId
          })

        if (reportError) {
          results.errors.push(`작업일지 생성 실패: ${reportError.message}`)
        } else {
          results.reports++
        }
      }
    }

    console.log('🎉 현실적인 데이터 시딩 완료!')

    return NextResponse.json({
      success: true,
      message: '현실적인 건설 현장 데이터가 생성되었습니다!',
      results,
      summary: {
        profiles_updated: results.profiles_updated,
        new_assignments: results.assignments,
        attendance_records: results.attendance,
        daily_reports: results.reports,
        error_count: results.errors.length
      }
    })

  } catch (error) {
    console.error('❌ 시딩 오류:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: '현실적인 한국어 이름으로 기존 사용자를 업데이트하고 현실적인 출근/작업 데이터를 생성합니다.',
    features: [
      '기존 사용자 이름을 현실적인 한국어 이름으로 변경',
      '사이트별 작업자 배정',
      '현실적인 출근 패턴 (정상 75%, 연장 10%, 반일 10%, 결근 5%)', 
      '실제 건설 공정을 반영한 작업일지 생성',
      '기존 데이터와 충돌하지 않는 안전한 업데이트'
    ],
    target_names: WORKER_NAME_MAPPING.map((m: any) => `${m.newName} (${m.role})`)
  })
}