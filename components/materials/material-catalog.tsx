'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { useFontSize,  getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  Plus,
  Edit2,
  MoreVertical,
  Package,
  DollarSign,
  Building,
  Hash,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createMaterial, updateMaterial } from '@/app/actions/materials'
import { useToast } from '@/components/ui/use-toast'
import { ViewToggle, useViewMode, CardView, ListView } from '@/components/ui/view-toggle'
import { useSortableData } from '@/components/ui/sortable-table'
import type { SortConfig } from '@/components/ui/sortable-table'

interface MaterialCatalogProps {
  materials: any[]
  categories: any[]
  searchQuery: string
}

export function MaterialCatalog({ materials, categories, searchQuery }: MaterialCatalogProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    unit: 'ea',
    unit_price: '',
    supplier: '',
    material_code: '',
    is_active: true
  })

  // Create hierarchical category structure
  const createCategoryHierarchy = () => {
    const hierarchy = new Map()
    const rootCategories = categories.filter(cat => cat.level === 1)
    
    rootCategories.forEach(rootCat => {
      const subCategories = categories.filter(cat => cat.parent_id === rootCat.id)
      hierarchy.set(rootCat.id, {
        ...rootCat,
        children: subCategories
      })
    })
    
    return hierarchy
  }

  const categoryHierarchy = createCategoryHierarchy()

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchQuery || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.material_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || material.category_id === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // View mode state
  const [viewMode, setViewMode] = useViewMode('material-catalog', 'card')

  // Sortable data for table view
  const { data: sortedMaterials, sortConfig, setSortConfig } = useSortableData(filteredMaterials)

  // Table columns definition
  const tableColumns = [
    {
      key: 'material_code',
      label: '자재코드',
      sortable: true,
      width: '120px',
      render: (value: string) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{value || '-'}</span>
      )
    },
    {
      key: 'name',
      label: '자재명',
      sortable: true,
      render: (value: string, material: any) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {material.description && (
            <div className="text-xs text-gray-500 mt-1">{material.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'category.name',
      label: '카테고리',
      sortable: true,
      render: (value: string, material: any) => (
        <Badge variant="outline" className="text-xs">
          {material.category?.name || '-'}
        </Badge>
      )
    },
    {
      key: 'unit',
      label: '단위',
      sortable: true,
      align: 'center' as const,
      width: '80px'
    },
    {
      key: 'unit_price',
      label: '단가',
      sortable: true,
      align: 'right' as const,
      width: '120px',
      render: (value: number) => (
        value ? `${value.toLocaleString()}원` : '-'
      )
    },
    {
      key: 'current_stock',
      label: '재고',
      sortable: true,
      align: 'center' as const,
      width: '100px',
      render: (value: number, material: any) => {
        if (value === undefined) return '-'
        
        const stockColor = value <= (material.minimum_stock || 0) 
          ? 'text-red-600' 
          : value >= (material.maximum_stock || 999999)
          ? 'text-amber-600'
          : 'text-green-600'
          
        return (
          <span className={`font-medium ${stockColor}`}>
            {value} {material.unit}
          </span>
        )
      }
    },
    {
      key: 'minimum_stock',
      label: '최소재고',
      sortable: true,
      align: 'center' as const,
      width: '100px',
      render: (value: number, material: any) => 
        value ? `${value} ${material.unit}` : '-'
    },
    {
      key: 'actions',
      label: '작업',
      sortable: false,
      align: 'center' as const,
      width: '80px',
      render: (value: any, material: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="compact" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(material)}>
              <Edit2 className="h-4 w-4 mr-2" />
              수정
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Get materials for a specific category
  const getMaterialsForCategory = (categoryId: string) => {
    return filteredMaterials.filter(material => material.category_id === categoryId)
  }

  const handleSubmit = async () => {
    try {
      if (editingMaterial) {
        const result = await updateMaterial(editingMaterial.id, {
          ...formData,
          unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined
        })
        if (result.success) {
          toast({
            title: '자재 수정 완료',
            description: '자재 정보가 성공적으로 수정되었습니다.'
          })
          setEditingMaterial(null)
          setShowAddDialog(false)
        } else {
          toast({
            title: '자재 수정 실패',
            description: result.error,
            variant: 'destructive'
          })
        }
      } else {
        const result = await createMaterial({
          ...formData,
          code: formData.material_code,
          unit_price: formData.unit_price ? parseFloat(formData.unit_price) : undefined
        } as any)
        if (result.success) {
          toast({
            title: '자재 추가 완료',
            description: '새 자재가 성공적으로 추가되었습니다.'
          })
          setShowAddDialog(false)
          resetForm()
        } else {
          toast({
            title: '자재 추가 실패',
            description: result.error,
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '자재 처리 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      category_id: '',
      name: '',
      description: '',
      unit: 'ea',
      unit_price: '',
      supplier: '',
      material_code: '',
      is_active: true
    })
  }

  const handleEdit = (material: any) => {
    setEditingMaterial(material)
    setFormData({
      category_id: material.category_id || '',
      name: material.name,
      description: material.description || '',
      unit: material.unit,
      unit_price: material.unit_price?.toString() || '',
      supplier: material.supplier || '',
      material_code: material.material_code || '',
      is_active: material.is_active
    })
    setShowAddDialog(true)
  }

  return (
    <div className="space-y-4">
      {/* Category Filter - Hierarchical */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Tree - NPC-1000 section hidden for mobile optimization */}
        <div className="lg:col-span-1 hidden lg:block">
          <Card className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">자재 카테고리</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  !selectedCategory 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-800'
                }`}
              >
                📋 전체 자재
              </button>
              
              {Array.from(categoryHierarchy.values()).map(rootCategory => (
                <div key={rootCategory.id} className="space-y-1">
                  <button
                    onClick={() => toggleCategory(rootCategory.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded text-sm text-gray-900 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      {expandedCategories.has(rootCategory.id) ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      <Folder className="h-3.5 w-3.5" />
                      <span>{rootCategory.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {rootCategory.code}
                    </Badge>
                  </button>
                  
                  {expandedCategories.has(rootCategory.id) && Array.isArray(rootCategory.children) && (
                    <div className="ml-6 space-y-1">
                      {rootCategory.children.map((subCategory: any) => (
                        <button
                          key={subCategory.id}
                          onClick={() => setSelectedCategory(subCategory.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                            selectedCategory === subCategory.id 
                              ? 'bg-blue-100 text-blue-700 font-medium' 
                              : 'hover:bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-3.5 w-3.5" />
                            <span>{subCategory.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {getMaterialsForCategory(subCategory.id).length}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Materials Content */}
        <div className="col-span-1 lg:col-span-3 space-y-4">
          {/* Header with View Toggle */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {selectedCategory 
                  ? categories.find(c => c.id === selectedCategory)?.name || '자재 목록'
                  : '전체 자재 목록'
                }
              </h2>
              <p className="text-sm text-gray-900 mt-1">
                총 {filteredMaterials.length}개의 자재
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ViewToggle
                mode={viewMode}
                onModeChange={setViewMode}
                availableModes={['card', 'list']}
                size="sm"
              />
              <Button 
                onClick={() => {
                  resetForm()
                  setEditingMaterial(null)
                  setShowAddDialog(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                자재 추가
              </Button>
            </div>
          </div>

          {/* Materials Display */}
          {filteredMaterials.length > 0 ? (
            <>
              {viewMode === 'card' ? (
                <CardView columns={2}>
                  {filteredMaterials.map(material => (
                    <Card key={material.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">{material.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {material.category?.name}
                            </Badge>
                          </div>
                          {material.description && (
                            <p className="text-sm text-gray-900">{material.description}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="compact" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(material)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              수정
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-900">
                          <Hash className="h-3.5 w-3.5 text-gray-700" />
                          <span className="font-mono text-xs">{material.material_code}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Package className="h-3.5 w-3.5 text-gray-700" />
                          <span>단위: {material.unit}</span>
                        </div>
                        {material.unit_price && (
                          <div className="flex items-center gap-2 text-gray-900">
                            <DollarSign className="h-3.5 w-3.5 text-gray-700" />
                            <span>단가: {material.unit_price.toLocaleString()}원</span>
                          </div>
                        )}
                        {material.supplier && (
                          <div className="flex items-center gap-2 text-gray-900">
                            <Building className="h-3.5 w-3.5 text-gray-700" />
                            <span>공급업체: {material.supplier}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant={material.is_active ? 'default' : 'secondary'}>
                          {material.is_active ? '사용중' : '사용안함'}
                        </Badge>
                        {material.current_stock !== undefined && (
                          <div className="text-sm">
                            <span className={`font-medium ${
                              material.current_stock <= material.minimum_stock 
                                ? 'text-red-600' 
                                : material.current_stock >= material.maximum_stock
                                ? 'text-amber-600'
                                : 'text-green-600'
                            }`}>
                              재고: {material.current_stock} {material.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </CardView>
              ) : (
                <ListView
                  data={sortedMaterials}
                  columns={tableColumns}
                  onSort={setSortConfig}
                  sortConfig={sortConfig}
                  emptyMessage="자재가 없습니다"
                  hoverable
                  striped
                />
              )}
            </>
          ) : (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">자재가 없습니다</h3>
              <p className="text-gray-900 mb-4">
                {selectedCategory 
                  ? '선택한 카테고리에 등록된 자재가 없습니다.' 
                  : '등록된 자재가 없습니다.'
                }
              </p>
              <Button 
                onClick={() => {
                  resetForm()
                  setEditingMaterial(null)
                  setShowAddDialog(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                첫 번째 자재 추가
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Add/Edit Material Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? '자재 수정' : '새 자재 추가'}
            </DialogTitle>
            <DialogDescription>
              NPC-1000 표준에 따른 자재 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="category">카테고리 *</Label>
              <CustomSelect 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <CustomSelectTrigger className={cn(
                  "w-full mt-1.5",
                  touchMode === 'glove' && "min-h-[60px] text-base",
                  touchMode === 'precision' && "min-h-[44px] text-sm",
                  touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                )}>
                  <CustomSelectValue placeholder="카테고리 선택" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  {Array.from(categoryHierarchy.values()).map(rootCategory => (
                    Array.isArray(rootCategory.children) && rootCategory.children.map((subCategory: any) => (
                      <CustomSelectItem key={subCategory.id} value={subCategory.id}>
                        {rootCategory.name} - {subCategory.name} ({subCategory.code})
                      </CustomSelectItem>
                    ))
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>

            <div>
              <Label htmlFor="name">자재명 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: NPC-1000 표준 콘크리트"
                required
              />
            </div>

            <div>
              <Label htmlFor="material_code">자재 코드 *</Label>
              <Input
                id="material_code"
                value={formData.material_code}
                onChange={(e) => setFormData({ ...formData, material_code: e.target.value })}
                placeholder="예: NPC-1000-001"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">단위 *</Label>
                <CustomSelect 
                  value={formData.unit} 
                  onValueChange={(value) => setFormData({ ...formData, unit: value })}
                >
                  <CustomSelectTrigger className={cn(
                    "w-full mt-1.5",
                    touchMode === 'glove' && "min-h-[60px] text-base",
                    touchMode === 'precision' && "min-h-[44px] text-sm",
                    touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                  )}>
                    <CustomSelectValue />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="ea">개</CustomSelectItem>
                    <CustomSelectItem value="kg">kg</CustomSelectItem>
                    <CustomSelectItem value="ton">톤</CustomSelectItem>
                    <CustomSelectItem value="m">m</CustomSelectItem>
                    <CustomSelectItem value="m²">m²</CustomSelectItem>
                    <CustomSelectItem value="m³">m³</CustomSelectItem>
                    <CustomSelectItem value="L">리터</CustomSelectItem>
                    <CustomSelectItem value="box">박스</CustomSelectItem>
                    <CustomSelectItem value="set">세트</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              <div>
                <Label htmlFor="unit_price">단가 (원)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="supplier">공급업체</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="공급업체명"
              />
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="자재에 대한 추가 설명"
                rows={3}
                className="w-full mt-1.5 px-3 py-2 rounded-md border border-gray-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_active" className="font-normal cursor-pointer">
                즉시 사용 가능
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit}>
              {editingMaterial ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}