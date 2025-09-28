import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getDailyReportById, updateDailyReport } from '@/app/actions/admin/daily-reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: '일일보고 수정' }

interface DailyReportEditPageProps {
  params: { id: string }
}

export default async function AdminDailyReportEditPage({ params }: DailyReportEditPageProps) {
  await requireAdminProfile()
  const result = await getDailyReportById(params.id)
  const report = result.success && result.data ? (result.data as any) : null

  async function save(formData: FormData) {
    'use server'
    const status = String(formData.get('status') || '')
    const issues = String(formData.get('issues') || '')
    await updateDailyReport(params.id, {
      ...(status ? { status } : {}),
      ...(issues ? { issues } : { issues: null }),
    })
    revalidatePath(`/dashboard/admin/daily-reports/${params.id}`)
    redirect(`/dashboard/admin/daily-reports/${params.id}`)
  }

  const currentStatus = report?.status || 'draft'
  const currentIssues = report?.issues || report?.notes || ''

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>일일보고 수정</CardTitle>
          <CardDescription>ID: {params.id}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={save} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">상태</label>
              <select
                name="status"
                defaultValue={currentStatus}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="draft">임시저장</option>
                <option value="submitted">제출됨</option>
                <option value="approved">승인</option>
                <option value="rejected">반려</option>
              </select>
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
  )
}
