'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, BarChart3, TrendingUp, TrendingDown,
  PlusCircle, Edit, Save, X, AlertCircle,
  ChevronUp, ChevronDown, ChevronsUpDown
} from 'lucide-react'

interface ProductionManagementTabProps {
  profile: Profile
}

interface ProductionData {
  id: string
  production_date: string
  production_amount: number
  shipment_amount: number
  balance_amount: number
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export default function ProductionManagementTab({ profile }: ProductionManagementTabProps) {
  const [productionData, setProductionData] = useState<ProductionData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [sortField, setSortField] = useState<'production_date' | 'production_amount' | 'shipment_amount' | 'balance_amount'>('production_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  // Form state
  const [formData, setFormData] = useState({
    production_date: new Date().toISOString().slice(0, 10),
    production_amount: 0,
    shipment_amount: 0,
    notes: ''
  })
  
  const supabase = createClient()

  useEffect(() => {
    loadProductionData()
  }, [selectedMonth])

  const loadProductionData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('npc_production')
        .select('*')
        .gte('production_date', `${selectedMonth}-01`)
        .lte('production_date', `${selectedMonth}-31`)
        .order('production_date', { ascending: false })

      if (!error && data) {
        // Calculate balance amounts
        const dataWithBalance = data.map((item, index) => {
          const previousBalance = index > 0 ? data[index - 1].balance_amount || 0 : 0
          const balance = previousBalance + item.production_amount - item.shipment_amount
          
          return {
            ...item,
            balance_amount: balance
          }
        })
        
        setProductionData(dataWithBalance)
      } else if (error) {
        console.warn('Production data table not available:', error.message)
        // Load mock data when table doesn't exist
        const { mockProductionData } = await import('../mockData')
        const filteredMockData = mockProductionData.filter(item => 
          item.production_date.startsWith(selectedMonth)
        )
        setProductionData(filteredMockData)
      }
    } catch (error) {
      console.error('Failed to load production data:', error)
      // Fallback to mock data
      const { mockProductionData } = await import('../mockData')
      const filteredMockData = mockProductionData.filter(item => 
        item.production_date.startsWith(selectedMonth)
      )
      setProductionData(filteredMockData)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...formData,
        balance_amount: formData.production_amount - formData.shipment_amount,
        created_by: profile.id
      }

      if (editingId) {
        // Update existing record
        const { error } = await supabase
          .from('npc_production')
          .update(dataToSave)
          .eq('id', editingId)

        if (!error) {
          setEditingId(null)
          await loadProductionData()
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('npc_production')
          .insert([dataToSave])

        if (!error) {
          setShowAddForm(false)
          setFormData({
            production_date: new Date().toISOString().slice(0, 10),
            production_amount: 0,
            shipment_amount: 0,
            notes: ''
          })
          await loadProductionData()
        }
      }
    } catch (error) {
      console.error('Failed to save production data:', error)
      alert('저장에 실패했습니다.')
    }
  }

  const handleEdit = (item: ProductionData) => {
    setEditingId(item.id)
    setFormData({
      production_date: item.production_date,
      production_amount: item.production_amount,
      shipment_amount: item.shipment_amount,
      notes: item.notes || ''
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({
      production_date: new Date().toISOString().slice(0, 10),
      production_amount: 0,
      shipment_amount: 0,
      notes: ''
    })
  }

  const calculateTotals = () => {
    return productionData.reduce((acc, item) => ({
      totalProduction: acc.totalProduction + item.production_amount,
      totalShipment: acc.totalShipment + item.shipment_amount,
      currentBalance: productionData.length > 0 ? productionData[0].balance_amount : 0
    }), { totalProduction: 0, totalShipment: 0, currentBalance: 0 })
  }

  const totals = calculateTotals()

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: typeof sortField) => {
    if (field !== sortField) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-500" />
      : <ChevronDown className="h-4 w-4 text-blue-500" />
  }

  const sortedData = [...productionData].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="p-6">
      {/* Header Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              조회 월
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {!showAddForm && !editingId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            생산 기록 추가
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400">월 생산량</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {totals.totalProduction.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400">월 출고량</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {totals.totalShipment.toLocaleString()}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">현재 잔고</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {totals.currentBalance.toLocaleString()}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {editingId ? '생산 기록 수정' : '새 생산 기록'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                생산일자
              </label>
              <input
                type="date"
                value={formData.production_date}
                onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                생산량
              </label>
              <input
                type="number"
                value={formData.production_amount}
                onChange={(e) => setFormData({ ...formData, production_amount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                출고량
              </label>
              <input
                type="number"
                value={formData.shipment_amount}
                onChange={(e) => setFormData({ ...formData, shipment_amount: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                비고
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="메모 (선택)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500"
            >
              <X className="h-4 w-4 inline mr-1" />
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              <Save className="h-4 w-4 inline mr-1" />
              저장
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('production_date')}
              >
                <div className="flex items-center gap-1">
                  생산일자
                  {getSortIcon('production_date')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('production_amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  생산량
                  {getSortIcon('production_amount')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('shipment_amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  출고량
                  {getSortIcon('shipment_amount')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('balance_amount')}
              >
                <div className="flex items-center justify-end gap-1">
                  잔고량
                  {getSortIcon('balance_amount')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                비고
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  데이터를 불러오는 중...
                </td>
              </tr>
            ) : productionData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <AlertCircle className="h-12 w-12 text-orange-400" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        생산관리 데이터베이스가 준비되지 않았습니다
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                        npc_production 테이블이 생성되면 생산량, 출고량, 잔고량을 관리할 수 있습니다.
                        <br />현재는 UI 미리보기 모드입니다.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {editingId === item.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          value={formData.production_date}
                          onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input
                          type="number"
                          value={formData.production_amount}
                          onChange={(e) => setFormData({ ...formData, production_amount: parseInt(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-right"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <input
                          type="number"
                          value={formData.shipment_amount}
                          onChange={(e) => setFormData({ ...formData, shipment_amount: parseInt(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-right"
                        />
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                        {(formData.production_amount - formData.shipment_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={handleSave}
                          className="text-green-600 hover:text-green-800 mr-2"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {item.production_date}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {item.production_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {item.shipment_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                        {item.balance_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {item.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}