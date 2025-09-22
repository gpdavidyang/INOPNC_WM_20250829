# Page Header Component

A unified page header component that provides consistent navigation context across all pages in the construction work management system.

## Features

- **Responsive Design**: Adapts to mobile and desktop viewports
- **Accessibility**: Full ARIA support and keyboard navigation
- **Touch-Friendly**: Supports different touch modes (normal, glove, precision)
- **Breadcrumb Navigation**: Shows hierarchical page location
- **Contextual Actions**: Configurable action buttons
- **Back Navigation**: Optional back button with customizable behavior
- **Dark Mode**: Full dark theme support
- **Font Scaling**: Respects user font size preferences

## Basic Usage

```tsx
import { PageHeader } from '@/components/ui/page-header'

function MyPage() {
  return (
    <PageHeader
      title="페이지 제목"
      subtitle="페이지 설명 (선택사항)"
      breadcrumbs={[
        { label: '홈', href: '/dashboard' },
        { label: '상위 메뉴', href: '/dashboard/parent' },
        { label: '현재 페이지' }
      ]}
      actions={[
        {
          label: '저장',
          onClick: handleSave,
          variant: 'primary',
          icon: <Save className="h-4 w-4" />
        }
      ]}
    />
  )
}
```

## Pre-configured Variants

### DashboardPageHeader
For main dashboard pages with standard home breadcrumb.

```tsx
import { DashboardPageHeader } from '@/components/ui/page-header'

<DashboardPageHeader
  title="대시보드 페이지"
  subtitle="설명"
  actions={[...]}
/>
```

### AdminPageHeader
For admin pages with admin section breadcrumb.

```tsx
import { AdminPageHeader } from '@/components/ui/page-header'

<AdminPageHeader
  title="사용자 관리"
  subtitle="시스템 사용자를 관리합니다"
  actions={[...]}
/>
```

### ReportsPageHeader
For report pages with automatic back button.

```tsx
import { ReportsPageHeader } from '@/components/ui/page-header'

<ReportsPageHeader
  title="새 작업일지"
  subtitle="일일 작업 내용을 기록하세요"
  actions={[
    { label: '임시저장', onClick: saveDraft, variant: 'secondary' },
    { label: '제출', onClick: submit, variant: 'primary' }
  ]}
/>
```

### DocumentsPageHeader
For document management pages.

```tsx
import { DocumentsPageHeader } from '@/components/ui/page-header'

<DocumentsPageHeader
  title="문서 관리"
  subtitle="프로젝트 문서를 관리하세요"
  actions={[...]}
/>
```

## Props

### PageHeaderProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Page title |
| `subtitle` | `string` | undefined | Optional subtitle |
| `breadcrumbs` | `BreadcrumbItem[]` | `[]` | Breadcrumb navigation items |
| `actions` | `PageHeaderAction[]` | `[]` | Action buttons |
| `showBackButton` | `boolean` | `false` | Show back navigation button |
| `backButtonHref` | `string` | undefined | Custom back button URL (defaults to browser back) |
| `className` | `string` | undefined | Additional CSS classes |

### BreadcrumbItem

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Display text |
| `href` | `string` | Optional link URL |
| `icon` | `React.ReactNode` | Optional icon |

### PageHeaderAction

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | required | Button text |
| `onClick` | `() => void` | required | Click handler |
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'outline'` | `'primary'` | Button style |
| `icon` | `React.ReactNode` | undefined | Optional icon |
| `disabled` | `boolean` | `false` | Disabled state |

## Design Considerations

### Mobile Responsiveness
- Actions automatically collapse to icon-only on mobile
- Touch-friendly button sizes based on touch mode context
- Proper spacing for construction site usage

### Accessibility
- Full ARIA labeling for screen readers
- Keyboard navigation support
- Focus management
- Semantic HTML structure

### Performance
- Lightweight component with minimal re-renders
- Icons are tree-shaken when not used
- Efficient CSS classes using Tailwind

## Examples in Codebase

See the following files for real usage examples:
- `/app/dashboard/daily-reports/new/page.tsx` - ReportsPageHeader usage
- `/components/documents/documents-page-client.tsx` - DocumentsPageHeader usage  
- `/components/ui/page-header-examples.tsx` - Comprehensive examples

## Customization

The component follows the project's design system:
- Uses existing font size and touch mode contexts
- Consistent with button and typography styles
- Respects dark mode preferences
- Integrates with existing color schemes

## Integration with Dashboard Layout

The page header is designed to work within the existing DashboardLayout component:

```tsx
<DashboardLayout user={user} profile={profile}>
  <PageHeader title="My Page" />
  {/* Page content */}
</DashboardLayout>
```

The header automatically adapts to the dashboard's responsive behavior and navigation patterns.