'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserCog, HardHat, Building2, ArrowRight, Palette, Monitor, Smartphone } from 'lucide-react'

export default function PreviewHomePage() {
  const dashboards = [
    {
      title: '시스템 관리자',
      description: '전체 시스템 관리 및 통계 대시보드',
      href: '/preview/admin',
      icon: UserCog,
      color: 'bg-blue-500',
      features: ['전체 통계', '사용자 관리', '시스템 설정', '보고서 관리'],
    },
    {
      title: '현장 관리자',
      description: '현장 운영 및 작업자 관리 대시보드',
      href: '/preview/site-manager',
      icon: Building2,
      color: 'bg-green-500',
      features: ['일일 보고서', '작업자 배정', '현장 통계', '문서 관리'],
    },
    {
      title: '작업자',
      description: '개인 작업 내역 및 급여 확인',
      href: '/preview/worker',
      icon: HardHat,
      color: 'bg-orange-500',
      features: ['근무 내역', '급여 확인', '문서 제출', '일정 확인'],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full mb-4">
            <Palette className="h-4 w-4" />
            <span className="text-sm font-medium">UI 미리보기 모드</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">INOPNC WM 대시보드 미리보기</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            인증 없이 각 역할별 대시보드 UI를 확인할 수 있습니다. 실제 데이터가 아닌 목업 데이터로
            표시됩니다.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {dashboards.map(dashboard => {
            const Icon = dashboard.icon
            return (
              <Card key={dashboard.href} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`inline-flex p-3 rounded-lg ${dashboard.color} text-white mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{dashboard.title}</CardTitle>
                  <CardDescription>{dashboard.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {dashboard.features.map(feature => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="h-1.5 w-1.5 bg-gray-400 rounded-full" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  <Link href={dashboard.href}>
                    <Button className="w-full group">
                      미리보기
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Device Preview Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">데스크톱 뷰</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                관리자와 현장 관리자용 대시보드는 데스크톱 환경에 최적화되어 있습니다. 대형 화면에서
                더 많은 정보를 효율적으로 표시합니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">모바일 뷰</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                작업자 대시보드는 모바일 우선으로 설계되었습니다. 브라우저 창 크기를 조절하여 반응형
                디자인을 확인하세요.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">사용 방법</h2>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>• 각 역할별 카드를 클릭하여 해당 대시보드를 확인하세요</li>
            <li>• 브라우저 개발자 도구로 다양한 화면 크기에서 테스트하세요</li>
            <li>• 실제 데이터가 아닌 목업 데이터가 표시됩니다</li>
            <li>• UI 스타일과 레이아웃 확인에 집중하세요</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
