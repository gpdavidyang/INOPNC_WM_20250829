import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getUser } from '@/app/actions/admin/users'
import { PageHeader } from '@/components/ui/page-header'
import UserEditForm from '@/components/admin/users/UserEditForm'

const interpretActiveFlag = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'boolean') return value
  const normalized = String(value).trim().toLowerCase()
  if (['true', '1', 'y', 'yes', 'active', 'enabled'].includes(normalized)) return true
  if (['false', '0', 'n', 'no', 'inactive', 'disabled'].includes(normalized)) return false
  return null
}

const isOrganizationSelectable = (organization: any) => {
  const activeFlag = interpretActiveFlag(organization?.is_active)
  if (activeFlag !== null) return activeFlag
  return true
}

async function fetchOrganizations() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, is_active')
    .order('name')

  if (error) {
    console.error('[AdminUserEdit] failed to load organizations:', error.message)
    return []
  }

  const items = Array.isArray(data) ? data : []
  return items.filter(isOrganizationSelectable)
}

interface PageProps {
  params: { id: string }
}

export default async function AdminUserEditPage({ params }: PageProps) {
  const profile = await requireAdminProfile()
  const [userResult, organizations] = await Promise.all([getUser(params.id), fetchOrganizations()])

  const user = userResult.success && userResult.data ? (userResult.data as any) : null

  if (!user) {
    redirect('/dashboard/admin/users')
  }

  const mergedOrganizations = [...organizations]
  const currentOrgId = user.organization?.id || user.organization_id
  if (currentOrgId && !mergedOrganizations.some(org => String(org.id) === String(currentOrgId))) {
    mergedOrganizations.push({
      id: currentOrgId,
      name: user.organization?.name || '이름 없는 조직',
    })
  }

  const organizationOptions = mergedOrganizations.map(org => ({
    id: String(org.id),
    name: org.name || '이름 없는 조직',
  }))

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="사용자 수정"
        description="사용자 정보를 수정합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '사용자 관리', href: '/dashboard/admin/users' },
          { label: '사용자 수정' },
        ]}
        showBackButton
        backButtonHref={`/dashboard/admin/users/${params.id}`}
      />

      <UserEditForm
        user={{
          id: params.id,
          full_name: user.full_name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role,
          status: user.status,
          organization_id: user.organization?.id || user.organization_id || null,
        }}
        organizations={organizationOptions}
        allowOrganizationChange
      />
    </div>
  )
}
