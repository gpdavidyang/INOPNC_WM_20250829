import { Building, Building2, Mail, Phone, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const COMPANY_TYPE_LABEL: Record<string, string> = {
  npc: '원도급사',
  subcontractor: '협력업체',
  supplier: '자재업체',
}

interface PartnerDetailProps {
  partner: {
    id: string
    company_name: string
    company_type?: string
    status?: string
    contact_name?: string
    contact_phone?: string
    contact_email?: string
  }
  sites?: Array<{
    id: string
    name: string
    status: 'active' | 'inactive' | 'planning'
  }>
  contacts?: Array<{
    name: string
    phone?: string
    email?: string
    position?: string
  }>
}

export function PartnerDetail({ partner, sites = [], contacts = [] }: PartnerDetailProps) {
  const statusLabel = partner.status === 'inactive' ? '비활성' : '활성'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5" />
            {partner.company_name}
          </CardTitle>
          <CardDescription>협력사 정보를 확인하고 상태를 검토할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">기본 정보</div>
            <div className="space-y-2 text-sm">
              <Badge variant="secondary">
                {partner.company_type
                  ? COMPANY_TYPE_LABEL[partner.company_type] || partner.company_type
                  : '분류 미지정'}
              </Badge>
              <Badge variant={partner.status === 'inactive' ? 'outline' : 'default'}>
                {statusLabel}
              </Badge>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">담당자</div>
            <div className="space-y-2 text-sm">
              {partner.contact_name ? (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {partner.contact_name}
                </div>
              ) : (
                <div className="text-muted-foreground">담당자 정보 없음</div>
              )}
              {partner.contact_phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {partner.contact_phone}
                </div>
              ) : (
                <div className="text-muted-foreground">전화번호 미등록</div>
              )}
              {partner.contact_email ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {partner.contact_email}
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
            <Building className="h-5 w-5" /> 협업 안내
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            시공업체는 가입 승인 후 현장과 매핑되어 사용자 계정과 연동됩니다. Phase 2에서 신규 등록
            및 승인 프로세스가 제공될 예정입니다.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" /> 협업 현장
          </CardTitle>
          <CardDescription>파트너와 연결된 현장 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {sites.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">연동된 현장이 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>현장명</TableHead>
                  <TableHead className="w-[20%] text-right">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map(site => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium text-foreground">{site.name}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={site.status === 'active' ? 'secondary' : 'outline'}>
                        {site.status === 'active'
                          ? '활성'
                          : site.status === 'inactive'
                            ? '비활성'
                            : '준비중'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" /> 연락망
          </CardTitle>
          <CardDescription>파트너 현장 담당자와 주요 연락처입니다.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {contacts.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">등록된 담당자가 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%]">이름</TableHead>
                  <TableHead className="w-[25%]">직책</TableHead>
                  <TableHead className="w-[20%]">연락처</TableHead>
                  <TableHead>이메일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map(contact => (
                  <TableRow key={`${contact.name}-${contact.email ?? contact.phone ?? 'contact'}`}>
                    <TableCell className="font-medium text-foreground">{contact.name}</TableCell>
                    <TableCell>{contact.position ?? '-'}</TableCell>
                    <TableCell>{contact.phone ?? '-'}</TableCell>
                    <TableCell>{contact.email ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
