'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Share2, 
  Edit, 
  FileText, 
  AlertCircle, 
  Receipt, 
  Image, 
  User,
  Award,
  BarChart,
  Folder,
  Plus,
  Settings
} from 'lucide-react'
import { useUnifiedDocuments, type UnifiedDocument } from '@/hooks/use-unified-documents'
import { DOCUMENT_CATEGORIES, getCategoryInfo } from '@/lib/utils/document-utils'

interface DocumentCategoryManagerProps {
  siteId?: string
  userRole?: string
  onCategorySelect?: (categoryType: string) => void
  showCreateButton?: boolean
}

// 카테고리 아이콘 매핑
const CATEGORY_ICONS = {
  shared: Share2,
  markup: Edit,
  required: AlertCircle,
  invoice: Receipt,
  photo_grid: Image,
  personal: User,
  certificate: Award,
  blueprint: FileText,
  report: BarChart,
  other: Folder
} as const

export default function DocumentCategoryManager({
  siteId,
  userRole = 'user',
  onCategorySelect,
  showCreateButton = false
}: DocumentCategoryManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const {
    categories,
    statistics,
    loading,
    error,
    fetchCategories
  } = useUnifiedDocuments({ siteId })

  const handleCategoryClick = (categoryType: string) => {
    setSelectedCategory(categoryType)
    onCategorySelect?.(categoryType)
  }

  const getCategoryIcon = (categoryType: string) => {
    const IconComponent = CATEGORY_ICONS[categoryType as keyof typeof CATEGORY_ICONS] || Folder
    return <IconComponent className="h-5 w-5" />
  }

  const getCategoryCount = (categoryType: string): number => {
    return statistics?.by_category?.[categoryType] || 0
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">문서 카테고리를 불러오는 중...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            카테고리를 불러오는데 실패했습니다: {error}
          </div>
          <div className="text-center mt-4">
            <Button onClick={() => fetchCategories()} variant="outline" size="sm">
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 전체 통계 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>문서 카테고리</CardTitle>
            {showCreateButton && userRole === 'admin' && (
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                카테고리 추가
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* 전체 카테고리 카드 */}
            <CategoryCard
              categoryType="all"
              title="전체 문서"
              icon={<Folder className="h-5 w-5" />}
              count={statistics?.total_documents || 0}
              color="#6b7280"
              description="모든 카테고리의 문서"
              selected={selectedCategory === 'all'}
              onClick={() => handleCategoryClick('all')}
            />

            {/* 각 카테고리 카드 */}
            {categories
              .filter(category => getCategoryCount(category.category_type) > 0 || userRole === 'admin')
              .map((category) => (
                <CategoryCard
                  key={category.category_type}
                  categoryType={category.category_type}
                  title={category.display_name_ko}
                  icon={getCategoryIcon(category.category_type)}
                  count={getCategoryCount(category.category_type)}
                  color={category.color || '#6b7280'}
                  description={category.description}
                  selected={selectedCategory === category.category_type}
                  onClick={() => handleCategoryClick(category.category_type)}
                />
              ))}
          </div>
        </CardContent>
      </Card>

      {/* 카테고리별 상세 탭 */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">전체</TabsTrigger>
          {categories.slice(0, 5).map((category) => (
            <TabsTrigger key={category.category_type} value={category.category_type}>
              {category.display_name_ko}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>전체 문서 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(statistics?.by_category || {}).map(([categoryType, count]) => {
                    const category = categories.find(c => c.category_type === categoryType)
                    return (
                      <div key={categoryType} className="flex items-center gap-3 p-3 border rounded-lg">
                        {getCategoryIcon(categoryType)}
                        <div>
                          <div className="font-medium">{category?.display_name_ko || categoryType}</div>
                          <div className="text-sm text-muted-foreground">{count}개 문서</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.category_type} value={category.category_type} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category.category_type)}
                  {category.display_name_ko}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{category.description}</p>
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">문서 수</label>
                      <p className="text-sm">{getCategoryCount(category.category_type)}개</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">카테고리 타입</label>
                      <p className="text-sm">{category.category_type}</p>
                    </div>
                  </div>

                  {/* 카테고리별 설정 정보 */}
                  <CategorySettings categoryType={category.category_type} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

// 카테고리 카드 컴포넌트
interface CategoryCardProps {
  categoryType: string
  title: string
  icon: React.ReactNode
  count: number
  color: string
  description?: string
  selected: boolean
  onClick: () => void
}

function CategoryCard({
  categoryType,
  title,
  icon,
  count,
  color,
  description,
  selected,
  onClick
}: CategoryCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {icon}
          </div>
          <Badge variant={count > 0 ? 'default' : 'secondary'}>
            {count}
          </Badge>
        </div>
        
        <div>
          <h3 className="font-medium text-sm mb-1">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 카테고리별 설정 정보 컴포넌트
interface CategorySettingsProps {
  categoryType: string
}

function CategorySettings({ categoryType }: CategorySettingsProps) {
  const categoryInfo = getCategoryInfo(categoryType)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          카테고리 설정
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          {categoryInfo.allowedFileTypes && (
            <div>
              <label className="font-medium">허용된 파일 형식</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {categoryInfo.allowedFileTypes.map((type) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {categoryInfo.maxFileSize && (
            <div>
              <label className="font-medium">최대 파일 크기</label>
              <p className="text-muted-foreground">
                {formatFileSize(categoryInfo.maxFileSize)}
              </p>
            </div>
          )}

          <div>
            <label className="font-medium">승인 필요</label>
            <p className="text-muted-foreground">
              {categoryInfo.requiresApproval ? '예' : '아니요'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 유틸리티 함수
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}