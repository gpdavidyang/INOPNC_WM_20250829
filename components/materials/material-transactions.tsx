'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Trash2,
  Settings,
  Plus,
  Calendar,
  Building2,
  User,
  Package,
  FileText,
  Download,
  Filter
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  createMaterialTransaction,
  getMaterialTransactions,
  getMaterialInventory
} from '@/app/actions/materials'
import { getSites } from '@/app/actions/sites'
import { toast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface MaterialTransactionsProps {
  materials: unknown[]
  currentUser: any
  currentSite?: any
}

export function MaterialTransactions({ materials, currentUser, currentSite }: MaterialTransactionsProps) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [selectedSite, setSelectedSite] = useState('')
  const [dateRange, setDateRange] = useState({
    from: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  })
  
  // Form data for new transaction
  const [transactionForm, setTransactionForm] = useState({
    site_id: '',
    material_id: '',
    transaction_type: 'in' as 'in' | 'out' | 'return' | 'waste' | 'adjustment',
    quantity: '',
    reference_type: '',
    reference_id: '',
    notes: ''
  })

  useEffect(() => {
    loadSites()
    loadTransactions()
  }, [selectedSite, dateRange])

  const loadSites = async () => {
    const result = await getSites()
    if (result.success && result.data) {
      setSites(result.data)
    }
  }

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const filters: any = {
        date_from: dateRange.from,
        date_to: dateRange.to
      }
      if (selectedSite) filters.site_id = selectedSite

      const result = await getMaterialTransactions(filters)
      if (result.success && result.data) {
        setTransactions(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'out':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case 'return':
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      case 'waste':
        return <Trash2 className="h-4 w-4 text-amber-600" />
      case 'adjustment':
        return <Settings className="h-4 w-4 text-purple-600" />
      default:
        return null
    }
  }

  const getTransactionTypeName = (type: string) => {
    switch (type) {
      case 'in': return '입고'
      case 'out': return '출고'
      case 'return': return '반품'
      case 'waste': return '폐기'
      case 'adjustment': return '재고조정'
      default: return type
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'in':
        return <Badge variant="success">입고</Badge>
      case 'out':
        return <Badge variant="error">출고</Badge>
      case 'return':
        return <Badge variant="secondary">반품</Badge>
      case 'waste':
        return <Badge variant="warning">폐기</Badge>
      case 'adjustment':
        return <Badge variant="secondary">재고조정</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  const handleCreateTransaction = async () => {
    try {
      const result = await createMaterialTransaction({
        ...transactionForm,
        quantity: parseFloat(transactionForm.quantity)
      } as any)

      if (result.success) {
        toast({
          title: '거래 기록 완료',
          description: '자재 거래가 성공적으로 기록되었습니다.'
        })
        setShowTransactionDialog(false)
        resetForm()
        loadTransactions()
      } else {
        toast({
          title: '거래 기록 실패',
          description: result.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: '거래 기록 중 오류가 발생했습니다.',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setTransactionForm({
      site_id: '',
      material_id: '',
      transaction_type: 'in',
      quantity: '',
      reference_type: '',
      reference_id: '',
      notes: ''
    })
  }

  // Calculate summary statistics
  const summary = transactions.reduce((acc: any, transaction: any) => {
    if (transaction.transaction_type === 'in') {
      acc.totalIn += transaction.quantity
    } else if (transaction.transaction_type === 'out') {
      acc.totalOut += transaction.quantity
    } else if (transaction.transaction_type === 'waste') {
      acc.totalWaste += transaction.quantity
    }
    acc.totalTransactions++
    return acc
  }, {
    totalIn: 0,
    totalOut: 0,
    totalWaste: 0,
    totalTransactions: 0
  })

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="">모든 현장</option>
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <Input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="w-40"
          />
          <span className="flex items-center text-gray-500">~</span>
          <Input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="w-40"
          />
        </div>

        <Button 
          onClick={() => {
            resetForm()
            setShowTransactionDialog(true)
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          거래 기록
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 거래</p>
              <p className="text-2xl font-bold">{summary.totalTransactions}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 입고</p>
              <p className="text-2xl font-bold text-green-600">{summary.totalIn}</p>
            </div>
            <ArrowUpRight className="h-8 w-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 출고</p>
              <p className="text-2xl font-bold text-red-600">{summary.totalOut}</p>
            </div>
            <ArrowDownRight className="h-8 w-8 text-red-400" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">폐기량</p>
              <p className="text-2xl font-bold text-amber-600">{summary.totalWaste}</p>
            </div>
            <Trash2 className="h-8 w-8 text-amber-400" />
          </div>
        </Card>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            거래 내역을 불러오는 중...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            거래 내역이 없습니다.
          </div>
        ) : (
          transactions.map(transaction => (
            <Card key={transaction.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getTransactionIcon(transaction.transaction_type)}
                    <h3 className="font-medium text-gray-900">
                      {transaction.material?.name || '알 수 없는 자재'}
                    </h3>
                    {getTransactionBadge(transaction.transaction_type)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      수량: {transaction.quantity} {transaction.material?.unit}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {transaction.site?.name || '알 수 없는 현장'}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {transaction.performer?.full_name || '알 수 없음'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm', { locale: ko })}
                    </span>
                  </div>
                  {transaction.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      비고: {transaction.notes}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          내역 다운로드
        </Button>
      </div>

      {/* Create Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>자재 거래 기록</DialogTitle>
            <DialogDescription>
              자재의 입출고 내역을 기록합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="t_site">현장 *</Label>
              <select
                id="t_site"
                value={transactionForm.site_id}
                onChange={(e) => setTransactionForm({ ...transactionForm, site_id: e.target.value })}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">현장 선택</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="t_type">거래 유형 *</Label>
              <select
                id="t_type"
                value={transactionForm.transaction_type}
                onChange={(e) => setTransactionForm({ ...transactionForm, transaction_type: e.target.value as any })}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="in">입고</option>
                <option value="out">출고</option>
                <option value="return">반품</option>
                <option value="waste">폐기</option>
                <option value="adjustment">재고조정</option>
              </select>
            </div>

            <div>
              <Label htmlFor="t_material">자재 *</Label>
              <select
                id="t_material"
                value={transactionForm.material_id}
                onChange={(e) => setTransactionForm({ ...transactionForm, material_id: e.target.value })}
                className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="">자재 선택</option>
                {materials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.material_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="t_quantity">수량 *</Label>
              <Input
                id="t_quantity"
                type="number"
                value={transactionForm.quantity}
                onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })}
                placeholder="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="t_notes">비고</Label>
              <textarea
                id="t_notes"
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                placeholder="거래 관련 메모"
                rows={3}
                className="w-full mt-1.5 px-3 py-2 rounded-md border border-gray-300"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransactionDialog(false)}>
              취소
            </Button>
            <Button 
              onClick={handleCreateTransaction}
              disabled={!transactionForm.site_id || !transactionForm.material_id || !transactionForm.quantity}
            >
              기록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}