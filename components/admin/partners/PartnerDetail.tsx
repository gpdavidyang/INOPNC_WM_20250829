import { Building2, Mail, Phone, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
interface PartnerDetailProps {
  partner: {
    id: string
    company_name: string
    status?: string
    contact_name?: string | null
    contact_phone?: string | null
    contact_email?: string | null
    address?: string | null
    business_number?: string | null
  }
}

export function PartnerDetail({ partner }: PartnerDetailProps) {
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
              <Badge variant={partner.status === 'inactive' ? 'outline' : 'default'}>
                {statusLabel}
              </Badge>
              {partner.business_number ? (
                <div className="text-muted-foreground">
                  사업자등록번호:{' '}
                  <span className="font-medium text-foreground">{partner.business_number}</span>
                </div>
              ) : (
                <div className="text-muted-foreground">사업자등록번호 미등록</div>
              )}
              {partner.address ? (
                <div className="text-muted-foreground">
                  주소: <span className="font-medium text-foreground">{partner.address}</span>
                </div>
              ) : (
                <div className="text-muted-foreground">주소 미등록</div>
              )}
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
    </div>
  )
}
