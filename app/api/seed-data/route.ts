import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// 현실적인 작업자 데이터
const WORKERS = [
  { id: '22222222-2222-2222-2222-222222222222', email: 'kim.worker@inopnc.com', full_name: '김철수', phone: '010-1111-2222', role: 'worker' },
  { id: '33333333-3333-3333-3333-333333333333', email: 'lee.worker@inopnc.com', full_name: '이영호', phone: '010-2222-3333', role: 'worker' },
  { id: '44444444-4444-4444-4444-444444444444', email: 'park.worker@inopnc.com', full_name: '박민수', phone: '010-3333-4444', role: 'worker' },
  { id: '55555555-5555-5555-5555-555555555555', email: 'choi.worker@inopnc.com', full_name: '최성훈', phone: '010-4444-5555', role: 'worker' },
  { id: '66666666-6666-6666-6666-666666666666', email: 'jung.worker@inopnc.com', full_name: '정대현', phone: '010-5555-6666', role: 'worker' },
  { id: '77777777-7777-7777-7777-777777777777', email: 'han.worker@inopnc.com', full_name: '한지민', phone: '010-6666-7777', role: 'worker' },
  { id: '88888888-8888-8888-8888-888888888888', email: 'song.worker@inopnc.com', full_name: '송준호', phone: '010-7777-8888', role: 'worker' },
  { id: '99999999-9999-9999-9999-999999999999', email: 'yoo.manager@inopnc.com', full_name: '유현석', phone: '010-8888-9999', role: 'site_manager' },
  { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', email: 'lim.manager@inopnc.com', full_name: '임재현', phone: '010-9999-0000', role: 'site_manager' },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', email: 'jang.manager@inopnc.com', full_name: '장혜진', phone: '010-0000-1111', role: 'site_manager' }
] as const

// 현장별 작업자 배정
const SITE_ASSIGNMENTS = [
  { siteName: '강남 A현장', workerIds: ['22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'], managerId: '99999999-9999-9999-9999-999999999999' },
  { siteName: '서초 B현장', workerIds: ['55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666'], managerId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
  { siteName: '송파 C현장', workerIds: ['77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888'], managerId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }
] as const

export async function POST(request: NextRequest) {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient()
    
    // Check if we need to use service role instead
    const serviceSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
      ? require('@supabase/supabase-js').createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
      : supabase
    
    console.log('🔍 Starting seeding process with service role...')
    
    const results = {
      profiles: 0,
      assignments: 0,
      attendance: 0,
      reports: 0,
      notifications: 0,
      errors: [] as string[]
    }

    // 1. 프로필 데이터 생성
    console.log('👥 작업자 프로필 생성 중...')
    
    for (const worker of WORKERS) {
      const { error } = await serviceSupabase
        .from('profiles')
        .upsert({
          ...worker,
          status: 'active'
        } as any, {
          onConflict: 'id'
        })
      
      if (error) {
        results.errors.push(`프로필 생성 실패 (${worker.full_name}): ${error.message}`)
      } else {
        results.profiles++
      }
    }

    // 2. 현장 정보 조회 (모든 활성 사이트 중에서 선택)
    console.log('🔍 Querying sites...')
    const { data: allSites, error: sitesError } = await serviceSupabase
      .from('sites')
      .select('id, name, status')
      .eq('status', 'active')
      .limit(10)
    
    console.log('🔍 Sites query result:', { allSites, error: sitesError })
    
    if (sitesError) {
      console.error('❌ Sites error:', sitesError)
      return NextResponse.json({ error: `현장 정보 조회 실패: ${sitesError.message}` }, { status: 500 })
    }

    if (!allSites || allSites.length === 0) {
      // Try without status filter
      console.log('🔍 Trying without status filter...')
      const { data: allSitesAny, error: anySitesError } = await serviceSupabase
        .from('sites')
        .select('id, name, status')
        .limit(10)
      
      console.log('🔍 All sites query result:', { allSitesAny, error: anySitesError })
      
      return NextResponse.json({ 
        error: '활성 현장 정보가 없습니다. 먼저 현장 데이터를 생성해주세요.',
        debug: { 
          found_active_sites: allSites?.length || 0,
          found_any_sites: allSitesAny?.length || 0,
          sample_sites: allSitesAny?.slice(0, 3)
        }
      }, { status: 400 })
    }

    // 가능한 사이트 중에서 우선적으로 찾기
    const targetSites = ['강남 A현장', '서초 B현장', '송파 C현장']
    const sites = []
    
    for (const targetName of targetSites) {
      const site = allSites.find(s => s.name === targetName)
      if (site) {
        sites.push(site)
      }
    }

    // 타겟 사이트가 없으면 처음 3개 사이트 사용
    if (sites.length === 0) {
      sites.push(...allSites.slice(0, 3))
    }

    // 3. 현장 배정 (유연한 매칭)
    const assignments = [
      { targetName: '강남 A현장', workerIds: ['22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444'], managerId: '99999999-9999-9999-9999-999999999999' },
      { targetName: '서초 B현장', workerIds: ['55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666'], managerId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
      { targetName: '송파 C현장', workerIds: ['77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888'], managerId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }
    ]
    
    for (let i = 0; i < assignments.length && i < sites.length; i++) {
      const assignment = assignments[i]
      const site = sites.find(s => s.name === assignment.targetName) || sites[i] // 매칭되는 사이트가 없으면 인덱스로 선택

      // 작업자들 배정
      for (const workerId of assignment.workerIds) {
        const assignedDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        const { error } = await serviceSupabase
          .from('site_assignments')
          .upsert({
            site_id: site.id,
            user_id: workerId,
            assigned_date: assignedDate,
            role: 'worker',
            is_active: true
          } as any, {
            onConflict: 'site_id,user_id'
          })

        if (error) {
          results.errors.push(`작업자 배정 실패: ${error.message}`)
        } else {
          results.assignments++
        }
      }

      // 관리자 배정
      const assignedDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const { error } = await serviceSupabase
        .from('site_assignments')
        .upsert({
          site_id: site.id,
          user_id: assignment.managerId,
          assigned_date: assignedDate,
          role: 'site_manager',
          is_active: true
        } as any, {
          onConflict: 'site_id,user_id'
        })

      if (error) {
        results.errors.push(`관리자 배정 실패: ${error.message}`)
      } else {
        results.assignments++
      }
    }

    // 4. 출근 기록 생성 (최근 30일, 평일만)
    for (let i = 0; i < assignments.length && i < sites.length; i++) {
      const assignment = assignments[i]
      const site = sites.find(s => s.name === assignment.targetName) || sites[i]
      if (!site) continue

      const allWorkers = [...assignment.workerIds, assignment.managerId]
      
      for (const workerId of allWorkers) {
        for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
          const workDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000)
          
          // 주말 제외
          if (workDate.getDay() === 0 || workDate.getDay() === 6) continue
          
          // 현실적인 근무 패턴
          const randomValue = Math.random()
          let laborHours: number, status: string, notes: string, checkOutTime: string
          
          if (randomValue < 0.1) { // 10% 반일
            laborHours = 0.5
            status = 'half_day'
            notes = '반일 근무'
            checkOutTime = '12:00:00'
          } else if (randomValue < 0.2) { // 10% 연장
            laborHours = 1.25
            status = 'present'
            notes = '연장 근무'
            checkOutTime = '18:00:00'
          } else { // 80% 정상
            laborHours = 1.0
            status = 'present'
            notes = '정상 근무'
            checkOutTime = '17:00:00'
          }

          const { error } = await serviceSupabase
            .from('attendance_records')
            .upsert({
              user_id: workerId,
              site_id: site.id,
              work_date: workDate.toISOString().split('T')[0],
              check_in_time: '08:00:00',
              check_out_time: checkOutTime,
              status: status,
              labor_hours: laborHours,
              work_hours: laborHours * 8,
              notes: notes
            }, {
              onConflict: 'user_id,work_date'
            })

          if (error) {
            results.errors.push(`출근 기록 생성 실패: ${error.message}`)
          } else {
            results.attendance++
          }
        }
      }
    }

    // 5. 작업일지 생성 (최근 15일, 평일만)
    const memberNames = ['슬라브', '기둥', '벽체', '보']
    const processTypes = ['균열', '면', '타설', '양생', '배근', '결속', '거푸집설치', '해체']
    
    for (let i = 0; i < assignments.length && i < sites.length; i++) {
      const assignment = assignments[i]
      const site = sites.find(s => s.name === assignment.targetName) || sites[i]
      if (!site) continue

      for (let j = 0; j < 15; j++) {
        const workDate = new Date(Date.now() - j * 24 * 60 * 60 * 1000)
        
        // 주말 제외
        if (workDate.getDay() === 0 || workDate.getDay() === 6) continue
        
        const memberName = memberNames[Math.floor(Math.random() * memberNames.length)]
        const processType = processTypes[Math.floor(Math.random() * processTypes.length)]
        const totalWorkers = assignment.workerIds.length
        
        // NPC1000 데이터 (타설/양생 시에만)
        const hasNpcData = processType === '타설' || processType === '양생'
        const npcIncoming = hasNpcData ? Math.floor(Math.random() * 50 + 10) : null
        const npcUsed = hasNpcData ? Math.floor(Math.random() * 30 + 5) : null
        const npcRemaining = hasNpcData ? Math.floor(Math.random() * 20 + 5) : null
        
        // 가끔 이슈 발생
        const issues = Math.random() < 0.2 ? 
          ['날씨로 인한 작업 지연', '자재 배송 지연', '장비 점검 필요', '안전 점검 실시'][Math.floor(Math.random() * 4)] : 
          null

        const { error } = await serviceSupabase
          .from('daily_reports')
          .upsert({
            site_id: site.id,
            work_date: workDate.toISOString().split('T')[0],
            member_name: memberName,
            process_type: processType,
            total_workers: totalWorkers,
            npc1000_incoming: npcIncoming,
            npc1000_used: npcUsed,
            npc1000_remaining: npcRemaining,
            issues: issues,
            status: 'submitted',
            created_by: assignment.managerId
          }, {
            onConflict: 'site_id,work_date,member_name,process_type'
          })

        if (error) {
          results.errors.push(`작업일지 생성 실패: ${error.message}`)
        } else {
          results.reports++
        }
      }
    }

    // 6. 알림 생성
    const notifications = []
    
    // 작업자들에게 작업 지시 알림
    for (const worker of WORKERS.filter(w => w.role === 'worker')) {
      notifications.push({
        user_id: worker.id,
        title: '새로운 작업 지시',
        message: '오늘 작업 일지를 작성해주세요.',
        type: 'info',
        is_read: Math.random() < 0.7, // 70% 확률로 읽음
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    // 관리자들에게 검토 알림
    for (const manager of WORKERS.filter(w => w.role === 'site_manager')) {
      notifications.push({
        user_id: manager.id,
        title: '작업 일지 검토',
        message: '새로운 작업 일지가 제출되었습니다.',
        type: 'warning',
        is_read: Math.random() < 0.5, // 50% 확률로 읽음
        created_at: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    if (notifications.length > 0) {
      const { error: notifError } = await serviceSupabase
        .from('notifications')
        .upsert(notifications)

      if (notifError) {
        results.errors.push(`알림 생성 실패: ${notifError.message}`)
      } else {
        results.notifications = notifications.length
      }
    }

    return NextResponse.json({
      success: true,
      message: '현실적인 건설 현장 데이터 시딩 완료!',
      results,
      summary: {
        workers: WORKERS.filter(w => w.role === 'worker').map(w => w.full_name),
        managers: WORKERS.filter(w => w.role === 'site_manager').map(w => w.full_name),
        sites: sites.map(s => s.name)
      }
    })

  } catch (error) {
    console.error('데이터 시딩 오류:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST 요청을 통해 현실적인 건설 현장 데이터를 시딩할 수 있습니다.',
    workers: WORKERS.map(w => ({ name: w.full_name, role: w.role })),
    sites: SITE_ASSIGNMENTS.map(s => ({ 
      name: s.siteName, 
      workers: s.workerIds.length, 
      manager: WORKERS.find(w => w.id === s.managerId)?.full_name 
    }))
  })
}