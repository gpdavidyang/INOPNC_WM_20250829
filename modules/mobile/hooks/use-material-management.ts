import { useState, useCallback, useEffect } from 'react'
import { SelectedMaterial, MaterialItem } from '../components/work-log/MaterialSelector'

interface MaterialUsageHistory {
  date: string
  siteId: string
  siteName: string
  materials: SelectedMaterial[]
  totalCost: number
  workLogId: string
}

interface MaterialStats {
  totalCost: number
  totalItems: number
  topMaterial?: MaterialItem
  categoryDistribution: Record<string, number>
}

export const useMaterialManagement = () => {
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([])
  const [materialHistory, setMaterialHistory] = useState<MaterialUsageHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load materials from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('worklog_materials')
      if (saved) {
        const materials = JSON.parse(saved)
        setSelectedMaterials(materials)
      }
    } catch (error) {
      console.error('Failed to load materials from localStorage:', error)
    }
  }, [])

  // Save materials to localStorage when changed
  const saveMaterialsToStorage = useCallback((materials: SelectedMaterial[]) => {
    try {
      localStorage.setItem('worklog_materials', JSON.stringify(materials))
    } catch (error) {
      console.error('Failed to save materials to localStorage:', error)
    }
  }, [])

  // Update selected materials
  const updateMaterials = useCallback((materials: SelectedMaterial[]) => {
    setSelectedMaterials(materials)
    saveMaterialsToStorage(materials)
  }, [saveMaterialsToStorage])

  // Add material
  const addMaterial = useCallback((material: MaterialItem, quantity: number = 1) => {
    const existing = selectedMaterials.find(m => m.id === material.id)
    if (existing) {
      // Update existing material quantity
      const updated = selectedMaterials.map(m => 
        m.id === material.id 
          ? { ...m, quantity: m.quantity + quantity, totalPrice: m.unitPrice * (m.quantity + quantity) }
          : m
      )
      updateMaterials(updated)
    } else {
      // Add new material
      const newMaterial: SelectedMaterial = {
        ...material,
        quantity,
        totalPrice: material.unitPrice * quantity,
      }
      updateMaterials([...selectedMaterials, newMaterial])
    }
  }, [selectedMaterials, updateMaterials])

  // Remove material
  const removeMaterial = useCallback((materialId: string) => {
    const updated = selectedMaterials.filter(m => m.id !== materialId)
    updateMaterials(updated)
  }, [selectedMaterials, updateMaterials])

  // Update material quantity
  const updateMaterialQuantity = useCallback((materialId: string, quantity: number) => {
    if (quantity <= 0) {
      removeMaterial(materialId)
      return
    }

    const updated = selectedMaterials.map(material => 
      material.id === materialId
        ? { ...material, quantity, totalPrice: material.unitPrice * quantity }
        : material
    )
    updateMaterials(updated)
  }, [selectedMaterials, updateMaterials, removeMaterial])

  // Update material notes
  const updateMaterialNotes = useCallback((materialId: string, notes: string) => {
    const updated = selectedMaterials.map(material => 
      material.id === materialId ? { ...material, notes } : material
    )
    updateMaterials(updated)
  }, [selectedMaterials, updateMaterials])

  // Clear all materials
  const clearMaterials = useCallback(() => {
    updateMaterials([])
  }, [updateMaterials])

  // Calculate totals
  const getTotalCost = useCallback(() => {
    return selectedMaterials.reduce((sum, material) => sum + material.totalPrice, 0)
  }, [selectedMaterials])

  const getTotalItems = useCallback(() => {
    return selectedMaterials.length
  }, [selectedMaterials])

  // Get category distribution
  const getCategoryDistribution = useCallback(() => {
    return selectedMaterials.reduce((acc, material) => {
      const category = material.category
      acc[category] = (acc[category] || 0) + material.totalPrice
      return acc
    }, {} as Record<string, number>)
  }, [selectedMaterials])

  // Get most expensive material
  const getTopMaterial = useCallback((): MaterialItem | undefined => {
    if (selectedMaterials.length === 0) return undefined
    
    return selectedMaterials.reduce((top, current) => 
      current.totalPrice > top.totalPrice ? current : top
    )
  }, [selectedMaterials])

  // Save materials to work log
  const saveMaterialsToWorkLog = useCallback(async (workLogData: {
    siteId: string
    siteName: string
    workDate: string
    workLogId?: string
  }) => {
    if (selectedMaterials.length === 0) return true

    try {
      setIsLoading(true)
      
      const materialData = {
        workLogId: workLogData.workLogId || `worklog_${Date.now()}`,
        siteId: workLogData.siteId,
        siteName: workLogData.siteName,
        workDate: workLogData.workDate,
        materials: selectedMaterials,
        totalCost: getTotalCost(),
        savedAt: new Date().toISOString(),
      }

      // Save to localStorage (in real app, this would be API call)
      const savedHistory = localStorage.getItem('material_usage_history')
      const history: MaterialUsageHistory[] = savedHistory ? JSON.parse(savedHistory) : []
      
      // Check if already exists and update, otherwise add new
      const existingIndex = history.findIndex(h => 
        h.workLogId === materialData.workLogId || 
        (h.siteId === materialData.siteId && h.date === materialData.workDate)
      )
      
      if (existingIndex >= 0) {
        history[existingIndex] = {
          date: materialData.workDate,
          siteId: materialData.siteId,
          siteName: materialData.siteName,
          materials: selectedMaterials,
          totalCost: materialData.totalCost,
          workLogId: materialData.workLogId,
        }
      } else {
        history.unshift({
          date: materialData.workDate,
          siteId: materialData.siteId,
          siteName: materialData.siteName,
          materials: selectedMaterials,
          totalCost: materialData.totalCost,
          workLogId: materialData.workLogId,
        })
      }

      // Keep only last 50 records
      const trimmedHistory = history.slice(0, 50)
      localStorage.setItem('material_usage_history', JSON.stringify(trimmedHistory))
      setMaterialHistory(trimmedHistory)

      return true
    } catch (error) {
      console.error('Failed to save materials to work log:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [selectedMaterials, getTotalCost])

  // Load material history
  const loadMaterialHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      const saved = localStorage.getItem('material_usage_history')
      if (saved) {
        const history = JSON.parse(saved)
        setMaterialHistory(history)
      }
    } catch (error) {
      console.error('Failed to load material history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get material stats for period
  const getMaterialStats = useCallback((period: 'daily' | 'weekly' | 'monthly'): MaterialStats => {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
    }

    const relevantHistory = materialHistory.filter(h => 
      new Date(h.date) >= startDate
    )

    const allMaterials = relevantHistory.flatMap(h => h.materials)
    const totalCost = allMaterials.reduce((sum, m) => sum + m.totalPrice, 0)
    const categoryDistribution = allMaterials.reduce((acc, material) => {
      acc[material.category] = (acc[material.category] || 0) + material.totalPrice
      return acc
    }, {} as Record<string, number>)

    const topMaterial = allMaterials.length > 0 
      ? allMaterials.reduce((top, current) => 
          current.totalPrice > top.totalPrice ? current : top
        )
      : undefined

    return {
      totalCost,
      totalItems: allMaterials.length,
      topMaterial,
      categoryDistribution,
    }
  }, [materialHistory])

  // Load history on mount
  useEffect(() => {
    loadMaterialHistory()
  }, [loadMaterialHistory])

  return {
    // State
    selectedMaterials,
    materialHistory,
    isLoading,

    // Material management
    updateMaterials,
    addMaterial,
    removeMaterial,
    updateMaterialQuantity,
    updateMaterialNotes,
    clearMaterials,

    // Calculations
    getTotalCost,
    getTotalItems,
    getCategoryDistribution,
    getTopMaterial,

    // Work log integration
    saveMaterialsToWorkLog,
    loadMaterialHistory,
    getMaterialStats,
  }
}