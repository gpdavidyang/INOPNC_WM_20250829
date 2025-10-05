import { Building2, Mail, MapPin, Phone, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DataTable, { type Column } from '@/components/admin/DataTable'

const TYPE_LABEL: Record<string, string> = {
  general_contractor: '원청',
  subcontractor: '협력사',
  supplier: '자재업체',
}

interface OrganizationDetailProps {
  organization: {
    id: string
    name: string
    type?: string
    address?: string
    contact_email?: string
    contact_phone?: string
    description?: string
    member_count?: number
    site_count?: number
  }
  members?: Array<{
    id: string
    name: string
    role: string
    email?: string
  }>
  sites?: Array<{
    id: string
    name: string
    status: 'active' | 'inactive' | 'planning'
  }>
}

export function OrganizationDetail({
  organization,
  members = [],
  sites = [],
}: OrganizationDetailProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5" />
            {organization.name}
          </CardTitle>
          <CardDescription>시스템에 등록된 조직 정보를 확인할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">기본 정보</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {organization.type
                    ? TYPE_LABEL[organization.type] || organization.type
                    : '분류 미지정'}
                </Badge>
              </div>
              {organization.description ? (
                <p className="leading-relaxed text-muted-foreground">{organization.description}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">연락처</div>
            <div className="space-y-2 text-sm">
              {organization.contact_phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {organization.contact_phone}
                </div>
              ) : (
                <div className="text-muted-foreground">전화번호 미등록</div>
              )}
              {organization.contact_email ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {organization.contact_email}
                </div>
              ) : (
                <div className="text-muted-foreground">이메일 미등록</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" /> 위치 및 규모
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {organization.address ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {organization.address}
            </div>
          ) : (
            <div className="text-muted-foreground">주소 정보 없음</div>
          )}
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" /> 조직 인원 {organization.member_count ?? 0}명
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" /> 연동 현장 {organization.site_count ?? 0}곳
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" /> 소속 구성원
          </CardTitle>
          <CardDescription>조직에 연동된 사용자 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {members.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">연동된 구성원이 없습니다.</p>
          ) : (
            <DataTable<{ id: string; name: string; role: string; email?: string }>
              data={members}
              rowKey={m => m.id}
              stickyHeader
              columns={
                [
                  {
                    key: 'name',
                    header: '이름',
                    sortable: true,
                    width: '35%',
                    render: m => <span className="font-medium text-foreground">{m.name}</span>,
                  },
                  {
                    key: 'role',
                    header: '역할',
                    sortable: true,
                    width: '25%',
                    render: m => <Badge variant="outline">{m.role}</Badge>,
                  },
                  { key: 'email', header: '이메일', sortable: true, render: m => m.email ?? '-' },
                ] as Column<{ id: string; name: string; role: string; email?: string }>[]
              }
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" /> 연동 현장
          </CardTitle>
          <CardDescription>이 조직과 연결된 현장 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {sites.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">연동된 현장이 없습니다.</p>
          ) : (
            <DataTable<{ id: string; name: string; status: 'active' | 'inactive' | 'planning' }>
              data={sites}
              rowKey={s => s.id}
              stickyHeader
              columns={
                [
                  {
                    key: 'name',
                    header: '현장명',
                    sortable: true,
                    render: s => <span className="font-medium text-foreground">{s.name}</span>,
                  },
                  {
                    key: 'status',
                    header: '상태',
                    sortable: true,
                    align: 'right',
                    width: '20%',
                    render: s => (
                      <Badge variant={s.status === 'active' ? 'secondary' : 'outline'}>
                        {s.status === 'active'
                          ? '활성'
                          : s.status === 'inactive'
                            ? '비활성'
                            : '준비중'}
                      </Badge>
                    ),
                  },
                ] as Column<{
                  id: string
                  name: string
                  status: 'active' | 'inactive' | 'planning'
                }>[]
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
