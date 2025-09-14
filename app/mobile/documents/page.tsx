'use client'

import React, { useState } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
import { Card, CardContent, Button, Stack, Row, Chip, Input, ChipGroup } from '@/modules/shared/ui'

export default function MobileDocumentsPage() {
  return (
    <MobileAuthGuard>
      <DocumentsContent />
    </MobileAuthGuard>
  )
}

const DocumentsContent: React.FC = () => {
  const { profile, isSiteManager } = useMobileUser()
  const [activeTab, setActiveTab] = useState<'required' | 'uploaded' | 'shared'>('required')
  const [searchQuery, setSearchQuery] = useState('')

  const tabs = [
    { id: 'required', label: '필수서류', badge: 3 },
    { id: 'uploaded', label: '내문서', badge: 0 },
    { id: 'shared', label: '공유문서', badge: 5 },
  ]

  const requiredDocuments = [
    {
      id: 1,
      name: '신분증 사본',
      type: 'ID_COPY',
      status: 'pending',
      dueDate: '2024-03-25',
      required: true,
    },
    {
      id: 2,
      name: '건강검진서',
      type: 'HEALTH_CERTIFICATE',
      status: 'submitted',
      dueDate: '2024-03-30',
      required: true,
    },
    {
      id: 3,
      name: '안전교육이수증',
      type: 'SAFETY_CERTIFICATE',
      status: 'approved',
      dueDate: '2024-04-01',
      required: true,
    },
  ]

  const uploadedDocuments = [
    {
      id: 1,
      name: '현장사진_20240320.jpg',
      type: 'PHOTO',
      uploadDate: '2024-03-20',
      size: '2.3MB',
    },
    {
      id: 2,
      name: '작업일지_20240319.pdf',
      type: 'REPORT',
      uploadDate: '2024-03-19',
      size: '1.8MB',
    },
  ]

  const sharedDocuments = [
    {
      id: 1,
      name: '안전수칙 가이드라인',
      type: 'GUIDELINE',
      shareDate: '2024-03-18',
      from: '안전관리팀',
    },
    {
      id: 2,
      name: '현장 배치도',
      type: 'LAYOUT',
      shareDate: '2024-03-17',
      from: '현장관리팀',
    },
    {
      id: 3,
      name: '월간 공지사항',
      type: 'NOTICE',
      shareDate: '2024-03-15',
      from: '본사',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default'
      case 'submitted':
        return 'tag1'
      case 'approved':
        return 'tag3'
      case 'rejected':
        return 'danger'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '제출 필요'
      case 'submitted':
        return '검토 중'
      case 'approved':
        return '승인됨'
      case 'rejected':
        return '반려'
      default:
        return '미확인'
    }
  }

  return (
    <MobileLayout
      title="문서함"
      userRole={profile?.role as 'worker' | 'site_manager'}
      showNotification={true}
    >
      <div className="p-4 space-y-4">
        {/* Tab Navigation */}
        <Card>
          <CardContent className="p-3">
            <ChipGroup>
              {tabs.map(tab => (
                <Chip
                  key={tab.id}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="cursor-pointer"
                >
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </Chip>
              ))}
            </ChipGroup>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="p-3">
            <Input
              placeholder="문서 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Required Documents Tab */}
        {activeTab === 'required' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="t-h2">필수 제출 서류</h3>
              <Button variant="primary" className="text-sm px-3 py-1 h-auto">
                + 서류 업로드
              </Button>
            </div>

            {requiredDocuments.map(doc => (
              <Card key={doc.id} className="mobile-activity-item">
                <CardContent className="p-4">
                  <Stack gap="sm">
                    <Row justify="between" align="start">
                      <div className="flex-1">
                        <h4 className="t-body font-medium">{doc.name}</h4>
                        <p className="t-cap">마감일: {doc.dueDate}</p>
                      </div>
                      <Chip variant={getStatusColor(doc.status) as any}>
                        {getStatusText(doc.status)}
                      </Chip>
                    </Row>

                    {doc.status === 'pending' && (
                      <Row gap="sm">
                        <Button variant="primary" className="flex-1 text-sm">
                          파일 선택
                        </Button>
                        <Button variant="outline" className="flex-1 text-sm">
                          카메라
                        </Button>
                      </Row>
                    )}

                    {doc.status === 'submitted' && (
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="t-cap">검토 중입니다. 승인까지 1-2일 소요됩니다.</p>
                      </div>
                    )}

                    {doc.status === 'approved' && (
                      <div className="p-2 bg-green-50 rounded">
                        <p className="t-cap">승인 완료되었습니다.</p>
                      </div>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Uploaded Documents Tab */}
        {activeTab === 'uploaded' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="t-h2">내가 업로드한 문서</h3>
              <Button variant="primary" className="text-sm px-3 py-1 h-auto">
                + 문서 추가
              </Button>
            </div>

            {uploadedDocuments.map(doc => (
              <Card key={doc.id} className="mobile-activity-item">
                <CardContent className="p-4">
                  <Row justify="between" align="start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {doc.type === 'PHOTO' ? '📸' : '📄'}
                      </div>
                      <div className="flex-1">
                        <h4 className="t-body font-medium">{doc.name}</h4>
                        <p className="t-cap">
                          업로드: {doc.uploadDate} | {doc.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
                        보기
                      </Button>
                      <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
                        공유
                      </Button>
                    </div>
                  </Row>
                </CardContent>
              </Card>
            ))}

            {uploadedDocuments.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="t-body">업로드한 문서가 없습니다.</p>
                  <p className="t-cap mb-4">첫 번째 문서를 추가해보세요.</p>
                  <Button variant="primary">문서 업로드</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Shared Documents Tab */}
        {activeTab === 'shared' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="t-h2">공유 문서</h3>
              <Chip variant="tag1">{sharedDocuments.length}개</Chip>
            </div>

            {sharedDocuments.map(doc => (
              <Card key={doc.id} className="mobile-activity-item">
                <CardContent className="p-4">
                  <Row justify="between" align="start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        {doc.type === 'GUIDELINE' ? '📋' : doc.type === 'LAYOUT' ? '🗺️' : '📢'}
                      </div>
                      <div className="flex-1">
                        <h4 className="t-body font-medium">{doc.name}</h4>
                        <p className="t-cap">
                          공유: {doc.shareDate} | {doc.from}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" className="text-sm px-3 py-1 h-auto">
                        보기
                      </Button>
                      <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
                        다운로드
                      </Button>
                    </div>
                  </Row>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions for Site Managers */}
        {isSiteManager && (
          <Card>
            <CardContent className="p-4">
              <h3 className="t-h2 mb-3">관리자 메뉴</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 flex-col gap-1">
                  <span className="text-xl">📋</span>
                  <span className="text-sm">서류 승인</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-1">
                  <span className="text-xl">📤</span>
                  <span className="text-sm">문서 공유</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-1">
                  <span className="text-xl">📊</span>
                  <span className="text-sm">제출 현황</span>
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-1">
                  <span className="text-xl">⚙️</span>
                  <span className="text-sm">서류 설정</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  )
}
