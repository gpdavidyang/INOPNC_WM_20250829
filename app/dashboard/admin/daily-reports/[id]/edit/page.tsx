import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDailyReportById, updateDailyReport, getSites } from '@/app/actions/admin/daily-reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: '일일보고 수정' }

interface DailyReportEditPageProps {
  params: { id: string }
}

export default async function AdminDailyReportEditPage({ params }: DailyReportEditPageProps) {
  await requireAdminProfile()
  const result = await getDailyReportById(params.id)
  const report = result.success && result.data ? (result.data as any) : null
  const sitesRes = await getSites()
  const siteOptions: Array<{ id: string; name: string }> = (
    sitesRes.success ? (sitesRes.data as any[]) : []
  ).map((s: any) => ({ id: s.id, name: s.name }))

  async function save(formData: FormData) {
    'use server'
    const site_id = String(formData.get('site_id') || report?.site_id || '') || null
    const work_date = String(formData.get('work_date') || report?.work_date || '') || null
    const component_name = String(formData.get('component_name') || '') || null
    const work_process = String(formData.get('work_process') || '') || null
    const work_section = String(formData.get('work_section') || '') || null
    const issues = String(formData.get('issues') || '') || null
    const safetyNotes = String(formData.get('safety_notes') || '') || null
    const notes = String(formData.get('notes') || '') || null
    const block = String(formData.get('loc_block') || '')
    const dong = String(formData.get('loc_dong') || '')
    const unit = String(formData.get('loc_unit') || '')

    await updateDailyReport(params.id, {
      ...(site_id ? { site_id } : {}),
      ...(work_date ? { work_date } : {}),
      component_name: component_name || null,
      work_process: work_process || null,
      work_section: work_section || null,
      issues,
      notes,
      additional_notes: safetyNotes ? { safetyNotes } : null,
      location_info: block || dong || unit ? { block, dong, unit } : null,
    })
    revalidatePath(`/dashboard/admin/daily-reports/${params.id}`)
    redirect(`/dashboard/admin/daily-reports/${params.id}`)
  }

  const currentIssues = report?.issues || report?.notes || ''

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="작업일지 수정"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '작업일지 관리', href: '/dashboard/admin/daily-reports' },
          { label: '작업일지 수정' },
        ]}
        showBackButton
        backButtonHref={`/dashboard/admin/daily-reports/${params.id}`}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>작업일지 수정</CardTitle>
            <CardDescription>ID: {params.id}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={save} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">작업일</label>
                  <input
                    type="date"
                    name="work_date"
                    defaultValue={report?.work_date || ''}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">현장</label>
                  <select
                    name="site_id"
                    defaultValue={report?.site_id || ''}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">변경 안 함</option>
                    {siteOptions.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">부재명</label>
                  <input
                    type="text"
                    name="component_name"
                    defaultValue={report?.component_name || ''}
                    placeholder="예: 벽체"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">작업공정</label>
                  <input
                    type="text"
                    name="work_process"
                    defaultValue={report?.work_process || ''}
                    placeholder="예: 콘크리트 타설"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">세부 구간</label>
                  <input
                    type="text"
                    name="work_section"
                    defaultValue={report?.work_section || ''}
                    placeholder="예: 3층 동측"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">블럭</label>
                  <input
                    type="text"
                    name="loc_block"
                    defaultValue={report?.location_info?.block || ''}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">동</label>
                  <input
                    type="text"
                    name="loc_dong"
                    defaultValue={report?.location_info?.dong || ''}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">호수/층</label>
                  <input
                    type="text"
                    name="loc_unit"
                    defaultValue={report?.location_info?.unit || ''}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">메모/이슈</label>
                <textarea
                  name="issues"
                  defaultValue={currentIssues}
                  className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="현황 메모"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">안전 메모</label>
                <textarea
                  name="safety_notes"
                  defaultValue={report?.additional_notes?.safetyNotes || ''}
                  className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="안전 관련 메모"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">비고</label>
                <textarea
                  name="notes"
                  defaultValue={report?.notes || ''}
                  className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="추가 비고"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" variant="outline">
                  저장
                </Button>
                <a
                  href={`/dashboard/admin/daily-reports/${params.id}`}
                  className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
                >
                  취소
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
