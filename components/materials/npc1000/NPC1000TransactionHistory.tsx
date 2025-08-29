'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Download,
  Calendar,
  Search,
  Filter,
  FileText,
  User,
  Building2,
  Package,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Transaction {
  id: string
  transaction_type: 'in' | 'out' | 'return' | 'waste' | 'adjustment'
  quantity: number
  unit_price?: number
  total_price?: number
  reference_type?: string
  reference_number?: string
  supplier_name?: string
  delivery_note_number?: string
  transaction_date: string
  notes?: string
  created_by?: string
  created_by_name?: string
  site_name?: string
  running_balance?: number
}

interface NPC1000TransactionHistoryProps {
  siteId: string
}

export function NPC1000TransactionHistory({ siteId }: NPC1000TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [dateRange, setDateRange] = useState({
    from: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  })

  useEffect(() => {
    if (siteId) {
      loadTransactions()
    }
  }, [siteId, filterType, dateRange])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockData: Transaction[] = [
        {
          id: '1',
          transaction_type: 'in',
          quantity: 2000,
          unit_price: 45000,
          total_price: 90000000,
          supplier_name: '한국NPC(주)',
          delivery_note_number: 'DN-2024-0315-001',
          transaction_date: '2024-03-15T10:30:00',
          notes: '정기 입고',
          created_by: 'user1',
          created_by_name: '김현장',
          site_name: '서울 강남 현장',
          running_balance: 7000
        },
        {
          id: '2',
          transaction_type: 'out',
          quantity: 350,
          reference_type: 'daily_report',
          reference_number: 'DR-2024-0314-001',
          transaction_date: '2024-03-14T14:20:00',
          notes: '균열보수 작업',
          created_by: 'user2',
          created_by_name: '이작업',
          site_name: '서울 강남 현장',
          running_balance: 5000
        },
        {
          id: '3',
          transaction_type: 'waste',
          quantity: 50,
          transaction_date: '2024-03-14T16:45:00',
          notes: '작업 중 손실',
          created_by: 'user2',
          created_by_name: '이작업',
          site_name: '서울 강남 현장',
          running_balance: 4950
        },
        {
          id: '4',
          transaction_type: 'return',
          quantity: 100,
          supplier_name: '한국NPC(주)',
          transaction_date: '2024-03-13T11:00:00',
          notes: '품질 불량 반품',
          created_by: 'user1',
          created_by_name: '김현장',
          site_name: '서울 강남 현장',
          running_balance: 5050
        },
        {
          id: '5',
          transaction_type: 'adjustment',
          quantity: -20,
          transaction_date: '2024-03-12T17:30:00',
          notes: '재고 실사 조정',
          created_by: 'user1',
          created_by_name: '김현장',
          site_name: '서울 강남 현장',
          running_balance: 5150
        }
      ]
      setTransactions(mockData)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.delivery_note_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.created_by_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || transaction.transaction_type === filterType
    
    return matchesSearch && matchesFilter
  })

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowDownCircle className="w-5 h-5 text-green-600" />
      case 'out':
        return <ArrowUpCircle className="w-5 h-5 text-red-600" />
      case 'return':
        return <RefreshCw className="w-5 h-5 text-orange-600" />
      case 'waste':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      case 'adjustment':
        return <TrendingUp className="w-5 h-5 text-blue-600" />
      default:
        return <Package className="w-5 h-5 text-gray-600" />
    }
  }

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'in': return '입고'
      case 'out': return '출고'
      case 'return': return '반품'
      case 'waste': return '손실'
      case 'adjustment': return '조정'
      default: return type
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-50'
      case 'out': return 'text-red-600 bg-red-50'
      case 'return': return 'text-orange-600 bg-orange-50'
      case 'waste': return 'text-red-600 bg-red-50'
      case 'adjustment': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="메모, 공급업체, 전표번호, 담당자로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">전체 유형</option>
              <option value="in">입고</option>
              <option value="out">출고</option>
              <option value="return">반품</option>
              <option value="waste">손실</option>
              <option value="adjustment">조정</option>
            </select>
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-40"
            />
            <span className="flex items-center px-2">~</span>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-40"
            />
            <Button variant="outline" onClick={loadTransactions}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>
      </Card>

      {/* Transaction List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">거래 내역을 불러오는 중...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">거래 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    일시
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    구분
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수량
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래처/참조
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    담당자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    재고
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    비고
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction: any) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <p className="font-medium">
                          {format(new Date(transaction.transaction_date), 'MM.dd')}
                        </p>
                        <p className="text-gray-500">
                          {format(new Date(transaction.transaction_date), 'HH:mm')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.transaction_type)}
                        <Badge className={cn('text-xs', getTransactionColor(transaction.transaction_type))}>
                          {getTransactionLabel(transaction.transaction_type)}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className={cn(
                        'font-semibold',
                        transaction.transaction_type === 'in' ? 'text-green-600' : 
                        transaction.transaction_type === 'out' || transaction.transaction_type === 'waste' ? 'text-red-600' : 
                        'text-gray-900'
                      )}>
                        {transaction.transaction_type === 'in' ? '+' : '-'}
                        {transaction.quantity.toLocaleString()} kg
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.total_price ? (
                        <div>
                          <p className="font-medium">
                            ₩{transaction.total_price.toLocaleString()}
                          </p>
                          {transaction.unit_price && (
                            <p className="text-gray-500 text-xs">
                              @{transaction.unit_price.toLocaleString()}/kg
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {transaction.supplier_name ? (
                        <div>
                          <p className="font-medium">{transaction.supplier_name}</p>
                          {transaction.delivery_note_number && (
                            <p className="text-gray-500 text-xs">
                              {transaction.delivery_note_number}
                            </p>
                          )}
                        </div>
                      ) : transaction.reference_number ? (
                        <div>
                          <p className="text-gray-600">{transaction.reference_number}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{transaction.created_by_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <p className="font-medium">
                        {transaction.running_balance?.toLocaleString()} kg
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="text-gray-600 max-w-xs truncate">
                        {transaction.notes || '-'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}