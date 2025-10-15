'use client'

import React, { useState } from 'react'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import {
  Card,
  CardContent,
  Button,
  Stack,
  Row,
  Chip,
  Input,
  Grid,
  Badge,
} from '@/modules/shared/ui'

export const dynamic = 'force-dynamic'

export default function MobileMaterialsPage() {
  return (
    <MobileAuthGuard requiredRoles={['worker', 'site_manager']}>
      <MaterialsContent />
    </MobileAuthGuard>
  )
}

const MaterialsContent: React.FC = () => {
  const { profile, isSiteManager } = useUnifiedAuth()
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'history'>('inventory')
  const [searchQuery, setSearchQuery] = useState('')

  const materials = [
    {
      id: 1,
      name: '시멘트',
      category: 'concrete',
      currentStock: 250,
      unit: 'kg',
      minStock: 100,
      location: 'A동 창고',
      status: 'sufficient',
    },
    {
      id: 2,
      name: '철근 (12mm)',
      category: 'steel',
      currentStock: 45,
      unit: '말',
      minStock: 50,
      location: 'B동 야적장',
      status: 'low',
    },
    {
      id: 3,
      name: '벽돌',
      category: 'masonry',
      currentStock: 8,
      unit: '팔레트',
      minStock: 20,
      location: 'C동 창고',
      status: 'critical',
    },
    {
      id: 4,
      name: '배관자재 (PVC)',
      category: 'plumbing',
      currentStock: 120,
      unit: 'm',
      minStock: 80,
      location: 'A동 창고',
      status: 'sufficient',
    },
  ]

  const requests = [
    {
      id: 1,
      material: '시멘트',
      quantity: 100,
      unit: 'kg',
      requestDate: '2024-03-20',
      status: 'pending',
      requester: '김작업자',
    },
    {
      id: 2,
      material: '철근 (12mm)',
      quantity: 30,
      unit: '말',
      requestDate: '2024-03-19',
      status: 'approved',
      requester: '이현장',
    },
    {
      id: 3,
      material: '벽돌',
      quantity: 5,
      unit: '팔레트',
      requestDate: '2024-03-18',
      status: 'delivered',
      requester: '박기사',
    },
  ]

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'sufficient':
        return { color: 'tag3', text: '충분', bgColor: 'bg-green-50' }
      case 'low':
        return { color: 'tag1', text: '부족', bgColor: 'bg-yellow-50' }
      case 'critical':
        return { color: 'danger', text: '긴급', bgColor: 'bg-red-50' }
      default:
        return { color: 'default', text: '확인', bgColor: 'bg-gray-50' }
    }
  }

  const getRequestStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'default', text: '대기중' }
      case 'approved':
        return { color: 'tag1', text: '승인됨' }
      case 'delivered':
        return { color: 'tag3', text: '배송완료' }
      case 'rejected':
        return { color: 'danger', text: '반려됨' }
      default:
        return { color: 'default', text: '미확인' }
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'concrete':
        return '🏗️'
      case 'steel':
        return '⚙️'
      case 'masonry':
        return '🧱'
      case 'plumbing':
        return '🔧'
      default:
        return '📦'
    }
  }

  return (
    <MobileLayoutShell>
      <div className="px-4 pb-6 space-y-4">
        <header className="pt-6">
          <h1 className="t-h2">자재 관리</h1>
        </header>
        {/* Tab Navigation */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'inventory' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('inventory')}
                className="flex-1"
              >
                재고 현황
              </Button>
              <a
                href="/mobile/materials/requests"
                className={`flex-1 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm ${activeTab === 'requests' ? 'bg-black text-white' : ''}`}
              >
                요청 내역
              </a>
              <Button
                variant={activeTab === 'history' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('history')}
                className="flex-1"
              >
                사용 기록
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardContent className="p-3">
            <Input
              placeholder="자재명 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-3">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="text-center p-3">
                <div className="text-2xl mb-1">📦</div>
                <p className="t-cap">전체 자재</p>
                <p className="t-body font-bold">{materials.length}</p>
              </Card>
              <Card className="text-center p-3">
                <div className="text-2xl mb-1">⚠️</div>
                <p className="t-cap">부족 자재</p>
                <p className="t-body font-bold text-orange-600">
                  {materials.filter(m => m.status === 'low' || m.status === 'critical').length}
                </p>
              </Card>
              <Card className="text-center p-3">
                <div className="text-2xl mb-1">🚨</div>
                <p className="t-cap">긴급 보충</p>
                <p className="t-body font-bold text-red-600">
                  {materials.filter(m => m.status === 'critical').length}
                </p>
              </Card>
            </div>

            {/* Materials List */}
            {materials.map(material => {
              const statusInfo = getStatusInfo(material.status)

              return (
                <Card
                  key={material.id}
                  className={`border-l-4 ${
                    material.status === 'critical'
                      ? 'border-l-red-500'
                      : material.status === 'low'
                        ? 'border-l-yellow-500'
                        : 'border-l-green-500'
                  }`}
                >
                  <CardContent className="p-4">
                    <Stack gap="sm">
                      <Row justify="between" align="start">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{getCategoryIcon(material.category)}</div>
                          <div className="flex-1">
                            <h4 className="t-body font-medium">{material.name}</h4>
                            <p className="t-cap">위치: {material.location}</p>
                          </div>
                        </div>
                        <Chip variant={statusInfo.color as any}>{statusInfo.text}</Chip>
                      </Row>

                      <div className={`p-3 rounded-lg ${statusInfo.bgColor}`}>
                        <Row justify="between">
                          <div>
                            <p className="t-cap">현재 재고</p>
                            <p className="t-body font-bold">
                              {material.currentStock} {material.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="t-cap">최소 재고</p>
                            <p className="t-body">
                              {material.minStock} {material.unit}
                            </p>
                          </div>
                        </Row>

                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                material.status === 'critical'
                                  ? 'bg-red-500'
                                  : material.status === 'low'
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min(100, (material.currentStock / material.minStock) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <Row gap="sm">
                        <a
                          href="/mobile/materials/requests/new"
                          className="flex-1 inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm bg-black text-white"
                        >
                          요청하기
                        </a>
                        <Button variant="outline" className="flex-1 text-sm">
                          사용 기록
                        </Button>
                        {isSiteManager && (
                          <Button variant="gray" className="text-sm px-3">
                            수정
                          </Button>
                        )}
                      </Row>
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="t-h2">자재 요청 내역</h3>
              <a
                href="/mobile/materials/requests/new"
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
              >
                + 새 요청
              </a>
            </div>

            {requests.map(request => {
              const statusInfo = getRequestStatusInfo(request.status)

              return (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <Stack gap="sm">
                      <Row justify="between" align="start">
                        <div className="flex-1">
                          <h4 className="t-body font-medium">{request.material}</h4>
                          <p className="t-cap">
                            수량: {request.quantity} {request.unit} | 요청일: {request.requestDate}
                          </p>
                          <p className="t-cap">요청자: {request.requester}</p>
                        </div>
                        <Chip variant={statusInfo.color as any}>{statusInfo.text}</Chip>
                      </Row>

                      {request.status === 'pending' && (
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="t-cap">승인 대기 중입니다.</p>
                        </div>
                      )}

                      {request.status === 'approved' && (
                        <div className="p-2 bg-green-50 rounded flex justify-between items-center">
                          <p className="t-cap">승인되었습니다. 배송 준비 중입니다.</p>
                          <Button variant="outline" className="text-xs px-2 py-1 h-auto">
                            추적
                          </Button>
                        </div>
                      )}

                      {request.status === 'delivered' && (
                        <div className="p-2 bg-blue-50 rounded">
                          <p className="t-cap">배송 완료되었습니다.</p>
                        </div>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <h3 className="t-h2">자재 사용 기록</h3>

            {[
              {
                date: '2024-03-20',
                material: '시멘트',
                used: 50,
                unit: 'kg',
                purpose: '기초 공사',
                user: '김작업자',
              },
              {
                date: '2024-03-19',
                material: '철근 (12mm)',
                used: 15,
                unit: '말',
                purpose: '기둥 보강',
                user: '이현장',
              },
              {
                date: '2024-03-18',
                material: '벽돌',
                used: 200,
                unit: '말',
                purpose: '벽체 공사',
                user: '박기사',
              },
            ].map((record, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <Row justify="between" align="start">
                    <div className="flex-1">
                      <h4 className="t-body font-medium">{record.material}</h4>
                      <p className="t-cap">
                        사용량: {record.used} {record.unit} | 용도: {record.purpose}
                      </p>
                      <p className="t-cap">
                        사용자: {record.user} | 일자: {record.date}
                      </p>
                    </div>
                    <Badge variant="tag1" />
                  </Row>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Request Form */}
        <Card>
          <CardContent className="p-4">
            <h3 className="t-h2 mb-3">빠른 요청</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex-col gap-1">
                <span className="text-xl">🏗️</span>
                <span className="text-sm">시멘트</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1">
                <span className="text-xl">⚙️</span>
                <span className="text-sm">철근</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1">
                <span className="text-xl">🧱</span>
                <span className="text-sm">벽돌</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1">
                <span className="text-xl">🔧</span>
                <span className="text-sm">배관자재</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayoutShell>
  )
}
