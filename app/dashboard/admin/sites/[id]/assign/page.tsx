import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PageHeader } from '@/components/ui/page-header'
import { buttonVariants } from '@/components/ui/button'
import AssignUsersPage from '@/components/admin/sites/AssignUsersPage'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: '사용자 배정' }

export default async function AssignUsersPageRoute({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  const supabase = createClient()
  const { data: site } = await supabase
    .from('sites')
    .select('id, name, address')
    .eq('id', params.id)
    .maybeSingle()
  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="사용자 배정"
        subtitle={
          site?.name
            ? `현장: ${site.name}${site?.address ? ` · ${site.address}` : ''}`
            : '현장에 배정할 사용자를 선택하고 추가합니다.'
        }
        actions={
          <a
            href={`/dashboard/admin/sites/${params.id}?tab=assignments`}
            className={buttonVariants({ variant: 'outline', size: 'standard' })}
            role="button"
          >
            현장으로 돌아가기
          </a>
        }
      />
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <AssignUsersPage siteId={params.id} />
      </div>
    </div>
  )
}
