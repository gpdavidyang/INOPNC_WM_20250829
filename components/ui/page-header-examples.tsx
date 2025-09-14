'use client'

// This file contains usage examples for the PageHeader component
// These examples show different use cases and configurations


// Example 1: Basic page header with title only
export function BasicPageHeaderExample() {
  return (
    <PageHeader title="기본 페이지" />
  )
}

// Example 2: Page header with subtitle and breadcrumbs
export function DetailedPageHeaderExample() {
  return (
    <PageHeader
      title="상세 페이지"
      subtitle="이 페이지의 설명입니다"
      breadcrumbs={[
        { label: '홈', href: '/dashboard' },
        { label: '상위 메뉴', href: '/dashboard/parent' },
        { label: '현재 페이지' }
      ]}
    />
  )
}

// Example 3: Page header with actions
export function ActionsPageHeaderExample() {
  const handleSave = () => console.log('저장')
  const handleDelete = () => console.log('삭제')
  const handleEdit = () => console.log('수정')

  return (
    <PageHeader
      title="액션이 있는 페이지"
      subtitle="여러 액션 버튼을 포함한 페이지 헤더"
      actions={[
        {
          label: '수정',
          onClick: handleEdit,
          variant: 'secondary',
          icon: <Edit className="h-4 w-4" />
        },
        {
          label: '저장',
          onClick: handleSave,
          variant: 'primary',
          icon: <Save className="h-4 w-4" />
        },
        {
          label: '삭제',
          onClick: handleDelete,
          variant: 'danger',
          icon: <Trash2 className="h-4 w-4" />
        }
      ]}
    />
  )
}

// Example 4: Page header with back button
export function BackButtonPageHeaderExample() {
  return (
    <PageHeader
      title="돌아갈 수 있는 페이지"
      subtitle="뒤로 가기 버튼이 포함된 페이지"
      showBackButton={true}
      backButtonHref="/dashboard/parent-page"
      breadcrumbs={[
        { label: '홈', href: '/dashboard' },
        { label: '상위 페이지', href: '/dashboard/parent-page' },
        { label: '현재 페이지' }
      ]}
    />
  )
}

// Example 5: Dashboard page header (pre-configured)
export function DashboardPageHeaderExample() {
  const handleNewItem = () => console.log('새 항목 추가')
  const handleRefresh = () => console.log('새로고침')

  return (
    <DashboardPageHeader
      title="대시보드 페이지"
      subtitle="미리 구성된 대시보드 헤더"
      actions={[
        {
          label: '새로고침',
          onClick: handleRefresh,
          variant: 'ghost',
          icon: <RefreshCw className="h-4 w-4" />
        },
        {
          label: '새 항목',
          onClick: handleNewItem,
          variant: 'primary',
          icon: <Plus className="h-4 w-4" />
        }
      ]}
    />
  )
}

// Example 6: Admin page header (pre-configured)
export function AdminPageHeaderExample() {
  const handleSettings = () => console.log('설정')
  const handleExport = () => console.log('내보내기')

  return (
    <AdminPageHeader
      title="사용자 관리"
      subtitle="시스템 사용자를 관리합니다"
      actions={[
        {
          label: '내보내기',
          onClick: handleExport,
          variant: 'secondary',
          icon: <Download className="h-4 w-4" />
        },
        {
          label: '설정',
          onClick: handleSettings,
          variant: 'primary',
          icon: <Settings className="h-4 w-4" />
        }
      ]}
    />
  )
}

// Example 7: Reports page header (pre-configured with back button)
export function ReportsPageHeaderExample() {
  const handleSaveDraft = () => console.log('임시저장')
  const handleSubmit = () => console.log('제출')

  return (
    <ReportsPageHeader
      title="새 작업일지 작성"
      subtitle="일일 작업 내용과 현장 상황을 기록하세요"
      actions={[
        {
          label: '임시저장',
          onClick: handleSaveDraft,
          variant: 'secondary',
          icon: <Save className="h-4 w-4" />
        },
        {
          label: '제출',
          onClick: handleSubmit,
          variant: 'primary',
          icon: <Send className="h-4 w-4" />
        }
      ]}
    />
  )
}

// Example 8: Documents page header (pre-configured)
export function DocumentsPageHeaderExample() {
  const handleUpload = () => console.log('업로드')
  const handleShare = () => console.log('공유')
  const handleSearch = () => console.log('검색')

  return (
    <DocumentsPageHeader
      title="문서 관리"
      subtitle="프로젝트 문서를 관리하고 공유하세요"
      actions={[
        {
          label: '검색',
          onClick: handleSearch,
          variant: 'ghost',
          icon: <Search className="h-4 w-4" />
        },
        {
          label: '공유',
          onClick: handleShare,
          variant: 'secondary',
          icon: <Share className="h-4 w-4" />
        },
        {
          label: '업로드',
          onClick: handleUpload,
          variant: 'primary',
          icon: <Plus className="h-4 w-4" />
        }
      ]}
    />
  )
}

// Example 9: Disabled actions
export function DisabledActionsPageHeaderExample() {
  return (
    <PageHeader
      title="비활성화된 액션"
      subtitle="일부 액션이 비활성화된 상태"
      actions={[
        {
          label: '사용 가능',
          onClick: () => console.log('사용 가능한 액션'),
          variant: 'primary'
        },
        {
          label: '비활성화',
          onClick: () => console.log('비활성화된 액션'),
          variant: 'secondary',
          disabled: true
        }
      ]}
    />
  )
}

// Example 10: Complex navigation with icons
export function ComplexNavigationExample() {
  return (
    <PageHeader
      title="복잡한 네비게이션"
      subtitle="아이콘과 함께 표시되는 브레드크럼"
      breadcrumbs={[
        { 
          label: '홈', 
          href: '/dashboard',
          icon: <div className="h-3 w-3 bg-blue-500 rounded-full" />
        },
        { 
          label: '프로젝트', 
          href: '/dashboard/projects',
          icon: <div className="h-3 w-3 bg-green-500 rounded-full" />
        },
        { 
          label: '설정', 
          href: '/dashboard/projects/settings',
          icon: <div className="h-3 w-3 bg-orange-500 rounded-full" />
        },
        { 
          label: '고급 설정'
        }
      ]}
      showBackButton={true}
      actions={[
        {
          label: '저장 및 계속',
          onClick: () => console.log('저장 및 계속'),
          variant: 'primary'
        }
      ]}
    />
  )
}