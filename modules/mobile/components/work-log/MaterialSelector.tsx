'use client'

import React, { useState, useCallback } from 'react'

export interface MaterialItem {
  id: string
  code: string
  name: string
  unit: string
  category: 'concrete' | 'steel' | 'form' | 'misc'
  unitPrice: number
  description?: string
}

export interface SelectedMaterial extends MaterialItem {
  quantity: number
  totalPrice: number
  notes?: string
}

interface MaterialSelectorProps {
  selectedMaterials: SelectedMaterial[]
  onMaterialsChange: (materials: SelectedMaterial[]) => void
  disabled?: boolean
}

// NPC-1000 Material Database (simplified)
const NPC_MATERIALS: MaterialItem[] = [
  {
    id: 'npc-1001',
    code: 'CON-001',
    name: '레미콘 24-18-150',
    unit: 'm³',
    category: 'concrete',
    unitPrice: 85000,
    description: '압축강도 24MPa, 슬럼프 18cm, 굵은골재 최대치수 25mm',
  },
  {
    id: 'npc-1002', 
    code: 'CON-002',
    name: '레미콘 30-18-150',
    unit: 'm³',
    category: 'concrete',
    unitPrice: 92000,
    description: '압축강도 30MPa, 슬럼프 18cm, 굵은골재 최대치수 25mm',
  },
  {
    id: 'npc-1003',
    code: 'STL-001',
    name: 'H-BEAM 200×200×8×12',
    unit: 'ton',
    category: 'steel',
    unitPrice: 1350000,
    description: '구조용압연강재 H형강 200×200×8×12',
  },
  {
    id: 'npc-1004',
    code: 'STL-002',
    name: '철근 D19 (SD400)',
    unit: 'ton',
    category: 'steel', 
    unitPrice: 890000,
    description: '이형철근 직경19mm, 항복강도 400MPa',
  },
  {
    id: 'npc-1005',
    code: 'FRM-001',
    name: '합판 거푸집 12T',
    unit: 'm²',
    category: 'form',
    unitPrice: 15000,
    description: '콘크리트 거푸집용 합판 두께 12mm',
  },
  {
    id: 'npc-1006',
    code: 'FRM-002',
    name: '각재 50×100×3600',
    unit: 'm',
    category: 'form',
    unitPrice: 8500,
    description: '거푸집용 침엽수 각재 50×100×3600mm',
  },
  {
    id: 'npc-1007',
    code: 'MSC-001',
    name: '앵커볼트 M16×200',
    unit: 'ea',
    category: 'misc',
    unitPrice: 3500,
    description: '구조용 앵커볼트 M16×200mm, 아연도금',
  },
  {
    id: 'npc-1008',
    code: 'MSC-002',
    name: '방수시트 0.5T',
    unit: 'm²',
    category: 'misc',
    unitPrice: 4200,
    description: '건축용 방수시트 두께 0.5mm, HDPE',
  },
]

const CATEGORY_LABELS = {
  concrete: '콘크리트',
  steel: '철골/철근',
  form: '거푸집',
  misc: '기타자재',
}

const CATEGORY_COLORS = {
  concrete: '#0068FE',
  steel: '#9aa3b2', 
  form: '#2563eb',
  misc: '#667085',
}

export const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  selectedMaterials,
  onMaterialsChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Filter materials based on search and category
  const filteredMaterials = NPC_MATERIALS.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Add material to selection
  const handleAddMaterial = useCallback((material: MaterialItem) => {
    const existing = selectedMaterials.find(m => m.id === material.id)
    if (existing) return

    const newMaterial: SelectedMaterial = {
      ...material,
      quantity: 1,
      totalPrice: material.unitPrice,
    }

    onMaterialsChange([...selectedMaterials, newMaterial])
    setIsOpen(false)
  }, [selectedMaterials, onMaterialsChange])

  // Update material quantity
  const handleQuantityChange = useCallback((materialId: string, quantity: number) => {
    const updated = selectedMaterials.map(material => {
      if (material.id === materialId) {
        return {
          ...material,
          quantity: Math.max(0, quantity),
          totalPrice: material.unitPrice * Math.max(0, quantity),
        }
      }
      return material
    }).filter(material => material.quantity > 0)

    onMaterialsChange(updated)
  }, [selectedMaterials, onMaterialsChange])

  // Remove material
  const handleRemoveMaterial = useCallback((materialId: string) => {
    const updated = selectedMaterials.filter(material => material.id !== materialId)
    onMaterialsChange(updated)
  }, [selectedMaterials, onMaterialsChange])

  // Calculate total
  const totalAmount = selectedMaterials.reduce((sum, material) => sum + material.totalPrice, 0)

  return (
    <div className="material-selector">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[var(--num)] bg-opacity-10 rounded-full flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--num)" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">NPC-1000 자재관리</h3>
        </div>
        
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="px-3 py-1.5 text-sm font-medium text-[var(--num)] bg-[var(--num)] bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mobile-button"
        >
          + 자재추가
        </button>
      </div>

      {/* Selected Materials */}
      {selectedMaterials.length > 0 && (
        <div className="space-y-3 mb-4">
          {selectedMaterials.map(material => (
            <div key={material.id} className="bg-[var(--card)] rounded-lg p-4 border border-[var(--line)]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[material.category] }}
                    />
                    <span className="text-sm text-[var(--muted)]">{material.code}</span>
                  </div>
                  <p className="font-medium text-[var(--text)]">{material.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    단가: {material.unitPrice.toLocaleString()}원/{material.unit}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(material.id)}
                  className="w-6 h-6 flex items-center justify-center text-[var(--muted)] hover:text-red-500 transition-colors mobile-button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--muted)]">수량:</span>
                  <input
                    type="number"
                    value={material.quantity}
                    onChange={(e) => handleQuantityChange(material.id, Number(e.target.value))}
                    min="1"
                    step="0.1"
                    className="w-20 px-2 py-1 text-sm border border-[var(--line)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--num)]"
                  />
                  <span className="text-sm text-[var(--muted)]">{material.unit}</span>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-[var(--text)]">
                    {material.totalPrice.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Total */}
          <div className="bg-[var(--bg)] rounded-lg p-4 border border-[var(--line)]">
            <div className="flex items-center justify-between">
              <span className="font-medium text-[var(--text)]">총 자재비</span>
              <span className="text-lg font-bold text-[var(--num)]">
                {totalAmount.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Material Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg bg-[var(--card)] rounded-t-xl max-h-[80vh] overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
              <h4 className="text-lg font-bold text-[var(--text)]">자재 선택</h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] transition-colors mobile-button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Search and Category Filter */}
            <div className="p-4 border-b border-[var(--line)]">
              <input
                type="text"
                placeholder="자재명 또는 코드로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[var(--line)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--num)] mb-3"
              />
              
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-[var(--num)] text-white'
                      : 'bg-[var(--line)] text-[var(--muted)]'
                  }`}
                >
                  전체
                </button>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCategory(key)}
                    className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
                      selectedCategory === key
                        ? 'bg-[var(--num)] text-white'
                        : 'bg-[var(--line)] text-[var(--muted)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Material List */}
            <div className="overflow-y-auto max-h-96">
              {filteredMaterials.map(material => {
                const isSelected = selectedMaterials.some(m => m.id === material.id)
                
                return (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => handleAddMaterial(material)}
                    disabled={isSelected}
                    className={`w-full text-left p-4 border-b border-[var(--line)] transition-colors ${
                      isSelected 
                        ? 'bg-[var(--line)] opacity-50 cursor-not-allowed'
                        : 'hover:bg-[var(--bg)]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[material.category] }}
                          />
                          <span className="text-xs text-[var(--muted)]">{material.code}</span>
                          <span className="text-xs text-[var(--muted)]">
                            {CATEGORY_LABELS[material.category]}
                          </span>
                        </div>
                        <p className="font-medium text-[var(--text)] mb-1">{material.name}</p>
                        {material.description && (
                          <p className="text-sm text-[var(--muted)] mb-1">{material.description}</p>
                        )}
                      </div>
                      
                      <div className="text-right ml-4">
                        <p className="font-medium text-[var(--text)]">
                          {material.unitPrice.toLocaleString()}원
                        </p>
                        <p className="text-xs text-[var(--muted)]">/{material.unit}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
              
              {filteredMaterials.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-[var(--muted)]">검색 결과가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}