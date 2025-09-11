'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Building2, 
  MapPin,
  AlertCircle,
  FileText
} from 'lucide-react'
import AssignmentTooltip from './AssignmentTooltip'

interface Partner {
  id: string
  company_name: string
  business_number: string
}

interface Site {
  id: string
  name: string
  address: string
  status: string
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
  partner_company?: { company_name: string }
}

interface WizardStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: '파트너사 선택',
    description: '현장에 배정할 파트너사를 선택합니다',
    icon: <Building2 className="h-5 w-5" />
  },
  {
    id: 2,
    title: '현장 선택',
    description: '작업할 현장을 선택합니다',
    icon: <MapPin className="h-5 w-5" />
  },
  {
    id: 3,
    title: '사용자 선택',
    description: '배정할 사용자들을 선택합니다',
    icon: <Users className="h-5 w-5" />
  },
  {
    id: 4,
    title: '배정 설정',
    description: '배정 유형과 역할을 설정합니다',
    icon: <FileText className="h-5 w-5" />
  },
  {
    id: 5,
    title: '확인 및 완료',
    description: '배정 정보를 확인하고 완료합니다',
    icon: <CheckCircle className="h-5 w-5" />
  }
]

export default function AssignmentWizard({ 
  onClose, 
  onComplete 
}: { 
  onClose: () => void
  onComplete: () => void 
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Data states
  const [partners, setPartners] = useState<Partner[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [users, setUsers] = useState<User[]>([])
  
  // Selection states
  const [selectedPartner, setSelectedPartner] = useState<string>('')
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [assignmentType, setAssignmentType] = useState<string>('permanent')
  const [assignmentRole, setAssignmentRole] = useState<string>('worker')
  const [notes, setNotes] = useState<string>('')

  // Fetch data
  useEffect(() => {
    fetchPartners()
    fetchSites()
    fetchUsers()
  }, [])

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/admin/organizations/partner-companies')
      if (response.ok) {
        const data = await response.json()
        setPartners(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch partners:', error)
    }
  }

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites')
      if (response.ok) {
        const data = await response.json()
        setSites(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data?.filter((user: User) => user.role !== 'system_admin') || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    if (selectedUsers.length === 0 || !selectedSite) {
      alert('사용자와 현장을 모두 선택해주세요.')
      return
    }

    setLoading(true)
    try {
      const assignments = selectedUsers.map(userId => ({
        user_id: userId,
        site_id: selectedSite,
        assignment_type: assignmentType,
        role: assignmentRole,
        notes: notes || null
      }))

      const response = await fetch('/api/admin/assignment/user-assignments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments })
      })

      if (response.ok) {
        alert('배정이 완료되었습니다!')
        onComplete()
      } else {
        const error = await response.json()
        alert(`배정 실패: ${error.error}`)
      }
    } catch (error) {
      console.error('Assignment failed:', error)
      alert('배정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return selectedPartner !== ''
      case 2: return selectedSite !== ''
      case 3: return selectedUsers.length > 0
      case 4: return assignmentType !== '' && assignmentRole !== ''
      case 5: return true
      default: return false
    }
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">파트너사 선택</h3>
              <AssignmentTooltip type="partner" />
            </div>
            <p className="text-sm text-muted-foreground">
              현장에 배정할 사용자들이 소속된 파트너사를 선택해주세요.
            </p>
            <Select value={selectedPartner} onValueChange={setSelectedPartner}>
              <SelectTrigger>
                <SelectValue placeholder="파트너사를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {partners.map(partner => (
                  <SelectItem key={partner.id} value={partner.id}>
                    {partner.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPartner && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    {partners.find(p => p.id === selectedPartner)?.company_name} 선택됨
                  </span>
                </div>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">현장 선택</h3>
              <AssignmentTooltip type="site" />
            </div>
            <p className="text-sm text-muted-foreground">
              사용자들이 작업할 현장을 선택해주세요.
            </p>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger>
                <SelectValue placeholder="현장을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {sites
                  .filter(site => site.status === 'active')
                  .map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      <div>
                        <div className="font-medium">{site.name}</div>
                        <div className="text-xs text-muted-foreground">{site.address}</div>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedSite && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    {sites.find(s => s.id === selectedSite)?.name} 선택됨
                  </span>
                </div>
              </div>
            )}
          </div>
        )

      case 3:
        const filteredUsers = selectedPartner 
          ? users.filter(user => user.partner_company?.company_name === partners.find(p => p.id === selectedPartner)?.company_name)
          : users

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">사용자 선택</h3>
              <AssignmentTooltip type="assignment" />
            </div>
            <p className="text-sm text-muted-foreground">
              현장에 배정할 사용자들을 선택해주세요. {selectedPartner ? '선택된 파트너사의 직원들이 표시됩니다.' : '모든 사용자가 표시됩니다.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.includes(user.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (selectedUsers.includes(user.id)) {
                      setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                    } else {
                      setSelectedUsers([...selectedUsers, user.id])
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {user.role}
                      </Badge>
                    </div>
                    {selectedUsers.includes(user.id) && (
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedUsers.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    {selectedUsers.length}명 선택됨
                  </span>
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">배정 설정</h3>
            <p className="text-sm text-muted-foreground">
              배정 유형과 역할을 설정해주세요.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignment-type">배정 유형</Label>
                <Select value={assignmentType} onValueChange={setAssignmentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">정규 배정</SelectItem>
                    <SelectItem value="temporary">임시 배정</SelectItem>
                    <SelectItem value="substitute">대체 배정</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assignment-role">역할</Label>
                <Select value={assignmentRole} onValueChange={setAssignmentRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">작업자</SelectItem>
                    <SelectItem value="supervisor">감독자</SelectItem>
                    <SelectItem value="site_manager">현장관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">비고 (선택사항)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="배정에 대한 추가 정보를 입력하세요..."
                rows={3}
              />
            </div>
          </div>
        )

      case 5:
        const selectedPartnerName = partners.find(p => p.id === selectedPartner)?.company_name
        const selectedSiteName = sites.find(s => s.id === selectedSite)?.name
        const selectedUserNames = users
          .filter(user => selectedUsers.includes(user.id))
          .map(user => user.full_name)

        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">배정 정보 확인</h3>
            <p className="text-sm text-muted-foreground">
              아래 정보를 확인하고 배정을 완료하세요.
            </p>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">배정 요약</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">파트너사:</span>
                    <span className="text-sm font-medium">{selectedPartnerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">현장:</span>
                    <span className="text-sm font-medium">{selectedSiteName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">배정 인원:</span>
                    <span className="text-sm font-medium">{selectedUsers.length}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">배정 유형:</span>
                    <Badge variant="outline">
                      {assignmentType === 'permanent' ? '정규' : 
                       assignmentType === 'temporary' ? '임시' : '대체'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">역할:</span>
                    <Badge variant="outline">
                      {assignmentRole === 'worker' ? '작업자' : 
                       assignmentRole === 'supervisor' ? '감독자' : '현장관리자'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">배정 대상자</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedUserNames.map((name, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">비고</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep === step.id
                ? 'border-blue-500 bg-blue-500 text-white'
                : currentStep > step.id
                ? 'border-green-500 bg-green-500 text-white'
                : 'border-gray-300 bg-white text-gray-500'
            }`}>
              {currentStep > step.id ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                step.icon
              )}
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div className={`w-full h-0.5 mx-4 ${
                currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Info */}
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          {WIZARD_STEPS[currentStep - 1]?.title}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {WIZARD_STEPS[currentStep - 1]?.description}
        </p>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {getStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onClose : handlePrevious}
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? '취소' : '이전'}
        </Button>

        {currentStep === WIZARD_STEPS.length ? (
          <Button 
            onClick={handleComplete} 
            disabled={loading || !canProceedToNext()}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? '처리중...' : '배정 완료'}
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleNext} 
            disabled={!canProceedToNext()}
          >
            다음
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}