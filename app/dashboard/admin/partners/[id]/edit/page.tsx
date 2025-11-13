import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PartnerEditForm } from '@/components/admin/partners/PartnerEditForm'
import { PageHeader } from '@/components/ui/page-header'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: '자재거래처 수정',
}

interface PartnerEditPageProps {
  params: { id: string }
}

export default async function AdminPartnerEditPage({ params }: PartnerEditPageProps) {
  await requireAdminProfile()
  const supabase = createClient()

  let partner: Record<string, unknown> | null = null
  const { data, error } = await supabase
    .from('material_suppliers')
    .select('id, name, is_active, contact_person, phone, email, address, business_number')
    .eq('id', params.id)
    .maybeSingle()

  if (!error && data) {
    partner = {
      id: data.id,
      company_name: data.name,
      status: data.is_active === false ? 'inactive' : 'active',
      contact_name: data.contact_person,
      contact_phone: data.phone,
      contact_email: data.email,
      address: data.address,
      business_number: data.business_number,
    }
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="자재거래처 수정"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재거래처 관리', href: '/dashboard/admin/partners' },
          { label: '수정' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/partners"
      />
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        {partner ? (
          <PartnerEditForm partner={partner as any} />
        ) : (
          <p className="rounded-md border border-dashed border-muted-foreground/40 px-4 py-10 text-center text-sm text-muted-foreground">
            업체 정보를 불러오지 못했습니다. 업체가 존재하지 않거나 권한이 없습니다.
          </p>
        )}
      </div>
    </div>
  )
}
