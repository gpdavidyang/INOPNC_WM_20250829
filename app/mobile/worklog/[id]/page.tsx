import type { Metadata } from 'next'
import type { WorklogDetail, WorklogAttachment } from '@/types/worklog'
import { Suspense } from 'react'
import TaskDetailPageClient from './TaskDetailPageClient'
import Link from 'next/link'
import { headers } from 'next/headers'

export const metadata: Metadata = { title: '작업일지 상세' }

async function fetchMobileReportById(id: string) {
  const h = headers()
  const proto = h.get('x-forwarded-proto') || 'http'
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const cookie = h.get('cookie') || ''
  const origin = `${proto}://${host}`
  const partnerUrl = `${origin}/api/partner/daily-reports/${id}`
  const mobileUrl = `${origin}/api/mobile/daily-reports/${id}`

  // 1) Try partner-scoped detail first for partner/customer_manager
  const resPartner = await fetch(partnerUrl, {
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  })
  if (resPartner.ok) {
    const json = await resPartner.json()
    return json?.data || null
  }

  // 2) Fallback to mobile detail (site_manager/worker scope)
  const resMobile = await fetch(mobileUrl, {
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  })
  if (resMobile.ok) {
    const json = await resMobile.json()
    return json?.data || null
  }
  // 3) Any non-OK → 안전하게 null 반환 (UI에서 안내)
  return null
}

function toDetail(report: any): WorklogDetail {
  const wc = report?.work_content || report?.workContent || {}
  const loc = report?.location_info || report?.location || {}
  const materials = Array.isArray(report?.material_usage)
    ? report.material_usage
    : Array.isArray(report?.materials)
      ? report.materials
      : []
  // Support both raw and normalized attachments
  const rawAttachments = Array.isArray(report?.document_attachments)
    ? report.document_attachments
    : []
  const normalizedAttachments = Array.isArray(report?.attachments) ? report.attachments : []
  // Support both raw worker assignments and normalized workers
  const rawWorkers = Array.isArray(report?.worker_assignments) ? report.worker_assignments : []
  const normalizedWorkers = Array.isArray(report?.workers) ? report.workers : []

  const mapAttachment = (a: any): WorklogAttachment => {
    const hasRaw = a?.file_url || a?.file_name || a?.document_type
    if (hasRaw) {
      return {
        id: String(a?.id ?? a?.file_url ?? Math.random()),
        name: String(a?.file_name ?? '파일'),
        type: ((a?.document_type || '').includes('drawing')
          ? 'drawing'
          : (a?.document_type || '').includes('photo')
            ? 'photo'
            : 'document') as any,
        category: ((a?.document_type || '').includes('confirmation')
          ? 'completion'
          : (a?.document_type || '').includes('drawing')
            ? 'markup'
            : (a?.document_type || '').includes('photo')
              ? 'other'
              : 'other') as any,
        previewUrl: a?.file_url,
        fileUrl: a?.file_url,
      }
    }
    // normalized
    return {
      id: String(a?.id ?? a?.url ?? Math.random()),
      name: String(a?.name ?? '파일'),
      type: ((a?.type || '').includes('drawing')
        ? 'drawing'
        : (a?.type || '').includes('photo')
          ? 'photo'
          : 'document') as any,
      category: ((a?.type || '').includes('completion')
        ? 'completion'
        : (a?.type || '').includes('drawing')
          ? 'markup'
          : (a?.type || '').includes('photo')
            ? 'other'
            : 'other') as any,
      previewUrl: a?.url,
      fileUrl: a?.url,
    }
  }

  const photoList: WorklogAttachment[] = []
  const drawingList: WorklogAttachment[] = []
  const completionList: WorklogAttachment[] = []
  const otherList: WorklogAttachment[] = []
  ;(rawAttachments.length ? rawAttachments : normalizedAttachments).forEach((a: any) => {
    const mapped = mapAttachment(a)
    const t = String(a?.document_type || a?.type || '').toLowerCase()
    if (t.includes('photo') || mapped.type === 'photo') photoList.push(mapped)
    else if (t.includes('drawing') || mapped.category === 'markup') drawingList.push(mapped)
    else if (
      t.includes('confirmation') ||
      t.includes('completion') ||
      mapped.category === 'completion'
    )
      completionList.push(mapped)
    else otherList.push(mapped)
  })

  const workers = rawWorkers.length ? rawWorkers : normalizedWorkers
  const manpower = workers.reduce(
    (sum: number, w: any) => sum + (Number(w?.labor_hours ?? w?.manDays) || 0),
    0
  )
  const statusNorm = String(report?.status || '').toLowerCase()
  const status = (
    ['approved', 'submitted', 'completed'].includes(statusNorm) ? 'approved' : 'draft'
  ) as WorklogDetail['status']

  return {
    id: report.id,
    siteId: report.site_id,
    siteName: report?.sites?.name || '현장 미지정',
    workDate: report.work_date,
    memberTypes: Array.isArray(wc?.memberTypes) ? wc.memberTypes : [],
    processes: Array.isArray(wc?.workProcesses)
      ? wc.workProcesses
      : Array.isArray(report?.processes)
        ? report.processes
        : [],
    workTypes: Array.isArray(wc?.workTypes) ? wc.workTypes : [],
    manpower,
    status,
    attachmentCounts: {
      photos: photoList.length,
      drawings: drawingList.length,
      completionDocs: completionList.length,
      others: otherList.length,
    },
    createdBy: report?.createdBy
      ? { id: report.createdBy.id || 'unknown', name: report.createdBy.name || '작성자' }
      : { id: report?.profiles?.id || 'unknown', name: report?.profiles?.full_name || '작성자' },
    updatedAt: report?.updated_at || report?.created_at || new Date().toISOString(),
    siteAddress: report?.sites?.address || undefined,
    location: {
      block: String(loc?.block || ''),
      dong: String(loc?.dong || ''),
      unit: String(loc?.unit || ''),
    },
    notes:
      typeof report?.additional_notes === 'string'
        ? report.additional_notes
        : report?.special_notes || '',
    safetyNotes: report?.safety_notes || '',
    additionalManpower: Array.isArray(report?.additional_notes?.additionalManpower)
      ? report.additional_notes.additionalManpower.map((it: any, idx: number) => ({
          id: String(it?.id ?? idx),
          name: String(it?.name || it?.worker_name || `추가 인력 ${idx + 1}`),
          manpower: Number(it?.manpower || 0),
        }))
      : [],
    attachments: {
      photos: photoList,
      drawings: drawingList,
      completionDocs: completionList,
      others: otherList,
    },
  }
}

export default async function MobileDailyReportDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: Record<string, string | undefined>
}) {
  const data = await fetchMobileReportById(params.id)
  if (!data) {
    // Seed fallback: use data passed from list page if available
    const seed = searchParams?.seed
    if (seed) {
      try {
        const json = JSON.parse(Buffer.from(decodeURIComponent(seed), 'base64').toString('utf-8'))
        const fromSeed = toDetail({
          id: json?.id,
          site_id: json?.siteId,
          sites: { name: json?.siteName, address: undefined },
          work_date: json?.date,
          work_content: {
            memberTypes: json?.memberTypes || [],
            workProcesses: json?.workProcesses || [],
            workTypes: json?.workTypes || [],
          },
          location_info: json?.location || {},
          worker_assignments: (json?.workers || []).map((w: any) => ({
            worker_name: w?.name,
            labor_hours: (w?.hours ?? 0) / 8,
          })),
          document_attachments: [
            ...(json?.attachments?.photos || []).map((f: any) => ({
              file_name: f?.name,
              file_url: f?.url,
              document_type: 'photo',
            })),
            ...(json?.attachments?.drawings || []).map((f: any) => ({
              file_name: f?.name,
              file_url: f?.url,
              document_type: 'drawing',
            })),
            ...(json?.attachments?.confirmations || []).map((f: any) => ({
              file_name: f?.name,
              file_url: f?.url,
              document_type: 'confirmation',
            })),
          ],
          profiles: json?.createdBy ? { id: json?.createdBy, full_name: json?.author } : undefined,
          status: json?.status === 'approved' ? 'approved' : 'draft',
        })
        return (
          <Suspense>
            <TaskDetailPageClient detail={fromSeed} />
          </Suspense>
        )
      } catch {
        // fallthrough to empty UI
      }
    }
    return (
      <Suspense>
        <div style={{ padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>
            작업일지 상세를 표시할 수 없습니다.
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
            다음 중 하나의 이유로 상세 정보를 불러오지 못했습니다.
          </p>
          <ul
            style={{
              marginTop: 8,
              marginBottom: 12,
              paddingLeft: 16,
              color: '#6b7280',
              fontSize: 13,
            }}
          >
            <li>작업내용이 아직 입력되지 않았습니다(‘작업내용 미입력’ 상태).</li>
            <li>접근 권한이 없거나, 현재 파트너사에 매핑되지 않은 현장입니다.</li>
            <li>해당 작업일지가 삭제되었거나 존재하지 않습니다.</li>
          </ul>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/mobile/worklog" className="viewer-action-btn secondary">
              목록으로 돌아가기
            </Link>
            <Link
              href={`/mobile/worklog/${encodeURIComponent(params.id)}`}
              className="viewer-action-btn primary"
            >
              다시 시도
            </Link>
          </div>
        </div>
      </Suspense>
    )
  }
  const detail = toDetail(data)
  return (
    <Suspense>
      {/* Full-screen page layout per updated spec */}
      <TaskDetailPageClient detail={detail} />
    </Suspense>
  )
}
