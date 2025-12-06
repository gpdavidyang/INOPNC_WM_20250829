'use client'

import { Edit, Save, Trash2, RefreshCw, Plus, Settings } from 'lucide-react'
import {
  PageHeader,
  DashboardPageHeader,
  AdminPageHeader,
  ReportsPageHeader,
  DocumentsPageHeader,
} from '@/components/page-header'

export default function PageHeaderDemoPage() {
  const handleAction = (action: string) => {
    console.log(`Action: ${action}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 space-y-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Basic Page Header */}
          <div>
            <h2 className="text-2xl font-bold mb-4 px-4">Basic Page Header</h2>
            <PageHeader title="기본 페이지 헤더" subtitle="기본적인 페이지 헤더 예시입니다" />
          </div>

          {/* Page Header with Breadcrumbs */}
          <div>
            <h2 className="text-2xl font-bold mb-4 px-4">With Breadcrumbs</h2>
            <PageHeader
              title="브레드크럼이 있는 페이지"
              subtitle="네비게이션 경로를 표시합니다"
              breadcrumbs={[
                { label: '홈', href: '/dashboard' },
                { label: '상위 메뉴', href: '/dashboard/parent' },
                { label: '현재 페이지' },
              ]}
            />
          </div>

          {/* Page Header with Actions */}
          <div>
            <h2 className="text-2xl font-bold mb-4 px-4">With Actions</h2>
            <PageHeader
              title="액션 버튼이 있는 페이지"
              subtitle="다양한 액션을 수행할 수 있습니다"
              breadcrumbs={[{ label: '홈', href: '/dashboard' }, { label: '현재 페이지' }]}
              actions={[
                {
                  label: '수정',
                  onClick: () => handleAction('edit'),
                  variant: 'secondary',
                  icon: <Edit className="h-4 w-4" />,
                },
                {
                  label: '저장',
                  onClick: () => handleAction('save'),
                  variant: 'primary',
                  icon: <Save className="h-4 w-4" />,
                },
                {
                  label: '삭제',
                  onClick: () => handleAction('delete'),
                  variant: 'danger',
                  icon: <Trash2 className="h-4 w-4" />,
                },
              ]}
            />
          </div>

          {/* Page Header with Back Button */}
          <div>
            <h2 className="text-2xl font-bold mb-4 px-4">With Back Button</h2>
            <PageHeader
              title="뒤로 가기 버튼이 있는 페이지"
              subtitle="이전 페이지로 돌아갈 수 있습니다"
              showBackButton={true}
              breadcrumbs={[
                { label: '홈', href: '/dashboard' },
                { label: '상위 페이지', href: '/dashboard/parent' },
                { label: '현재 페이지' },
              ]}
              actions={[
                {
                  label: '저장',
                  onClick: () => handleAction('save'),
                  variant: 'primary',
                  icon: <Save className="h-4 w-4" />,
                },
              ]}
            />
          </div>

          {/* Dashboard Page Header */}
          <div>
            <h2 className="text-2xl font-bold mb-4 px-4">Dashboard Page Header</h2>
            <DashboardPageHeader
              title="대시보드 페이지"
              subtitle="미리 구성된 대시보드 헤더입니다"
              actions={[
                {
                  label: '새로고침',
                  onClick: () => handleAction('refresh'),
                  variant: 'ghost',
                  icon: <RefreshCw className="h-4 w-4" />,
                },
                {
                  label: '새 항목',
                  onClick: () => handleAction('new'),
                  variant: 'primary',
                  icon: <Plus className="h-4 w-4" />,
                },
              ]}
            />
          </div>

          {/* Admin Page Header */}
          <div>
            <h2 className="text-2xl font-bold mb-4 px-4">Admin Page Header</h2>
            <AdminPageHeader
              title="관리자 페이지"
              subtitle="관리자 전용 기능을 제공합니다"
              actions={[
                {
                  label: '설정',
                  onClick: () => handleAction('settings'),
                  variant: 'primary',
                  icon: <Settings className="h-4 w-4" />,
                },
              ]}
            />
          </div>

          {/* Reports Page Header */}
          <div>
            <h2 className="text-2xl font-bold mb-4 px-4">Reports Page Header</h2>
            <ReportsPageHeader
              title="새 작업일지 작성"
              subtitle="일일 작업 내용을 기록하세요"
              actions={[
                {
                  label: '임시',
                  onClick: () => handleAction('draft'),
                  variant: 'secondary',
                  icon: <Save className="h-4 w-4" />,
                },
              ]}
            />
          </div>

          {/* Documents Page Header */}
          <div>
            <h2 className="text-2xl font-bold mb-4 px-4">Documents Page Header</h2>
            <DocumentsPageHeader
              title="문서 관리"
              subtitle="프로젝트 문서를 관리하세요"
              actions={[
                {
                  label: '새 문서',
                  onClick: () => handleAction('new-doc'),
                  variant: 'primary',
                  icon: <Plus className="h-4 w-4" />,
                },
              ]}
            />
          </div>

          {/* Disabled Actions Example */}
          <div>
            <h2 className="text-2xl font-bold mb-4 px-4">Disabled Actions</h2>
            <PageHeader
              title="비활성화된 액션"
              subtitle="일부 액션이 비활성화된 상태입니다"
              actions={[
                {
                  label: '사용 가능',
                  onClick: () => handleAction('available'),
                  variant: 'primary',
                },
                {
                  label: '비활성화',
                  onClick: () => handleAction('disabled'),
                  variant: 'secondary',
                  disabled: true,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
