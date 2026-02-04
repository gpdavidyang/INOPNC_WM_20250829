'use client'

import { Button } from '@/components/ui/button'
import {
    CustomSelect,
    CustomSelectContent,
    CustomSelectItem,
    CustomSelectTrigger,
    CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { openFileRecordInNewTab } from '@/lib/files/preview'
import { createClient } from '@/lib/supabase/client'
import { Calendar, FileCode, RefreshCw, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type Worker = { id: string; full_name: string }
type RecordRow = {
  worker_id: string
  worker: { full_name: string; role: string }
  site: { name: string }
  work_date: string
  base_pay: number
}

export default function SalaryRecordsList() {
  const supabase = useMemo(() => createClient(), [])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorker, setSelectedWorker] = useState<string>('all')
  const [yearMonth, setYearMonth] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [items, setItems] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['worker', 'site_manager'])
        .neq('status', 'inactive')
        .order('full_name', { ascending: true })
      if (Array.isArray(data)) {
        setWorkers(data as Worker[])
      }
    }
    load()
  }, [supabase])

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '100')
      if (search) params.set('search', search)
      if (yearMonth) params.set('yearMonth', yearMonth)
      const res = await fetch(`/api/admin/salary/records?${params.toString()}`)
      const json = await res.json()
      if (!json?.success) throw new Error(json?.error || '레코드 조회 실패')
      let rows = (json.data.records || []) as RecordRow[]
      if (selectedWorker && selectedWorker !== 'all') {
        rows = rows.filter(r => r.worker_id === selectedWorker)
      }
      setItems(rows)
    } catch (e: any) {
      setError(e?.message || '레코드 조회 실패')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openPayslip = (r: RecordRow) => {
    if (!r.work_date || !r.worker_id) return
    const d = new Date(r.work_date)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const displayName = (r.worker?.full_name || '').trim()
    const query = displayName ? `?name=${encodeURIComponent(displayName)}` : ''
    openFileRecordInNewTab({
      file_url: `/payslip/${r.worker_id}/${y}/${m}${query}`,
      file_name: `${displayName || 'payslip'}-${y}-${m}.html`,
      title: `${displayName || '급여'} ${y}-${m}`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
           <span className="text-[11px] font-black text-muted-foreground tracking-tight ml-1">작업자 검색</span>
           <div className="relative">
              <Input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="이름 또는 내용 검색"
                className="h-10 w-64 rounded-xl bg-gray-50 border-none pl-10 pr-4 text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
           </div>
        </div>

        <div className="flex flex-col gap-1.5">
           <span className="text-[11px] font-black text-muted-foreground tracking-tight ml-1">조회 년월</span>
           <div className="relative">
              <Input
                type="month"
                value={yearMonth}
                onChange={e => setYearMonth(e.target.value)}
                className="h-10 w-40 rounded-xl bg-gray-50 border-none pl-10 pr-4 text-sm"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
           </div>
        </div>

        <div className="flex flex-col gap-1.5">
           <span className="text-[11px] font-black text-muted-foreground tracking-tight ml-1">작업자 필터</span>
           <CustomSelect
             value={selectedWorker}
             onValueChange={setSelectedWorker}
           >
             <CustomSelectTrigger className="h-10 w-40 rounded-xl bg-gray-50 border-none px-4 text-sm font-bold">
               <CustomSelectValue placeholder="전체 작업자" />
             </CustomSelectTrigger>
             <CustomSelectContent>
               <CustomSelectItem value="all">전체 작업자</CustomSelectItem>
               {workers.map(w => (
                 <CustomSelectItem key={w.id} value={w.id}>
                   {w.full_name}
                 </CustomSelectItem>
               ))}
             </CustomSelectContent>
           </CustomSelect>
        </div>

        <Button
          variant="outline"
          className="h-10 rounded-xl px-6 gap-2 border-gray-200"
          onClick={fetchRecords}
          disabled={loading}
        >
          <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          <span>목록 동기화</span>
        </Button>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden text-sm">
        <table className="min-w-full">
          <thead>
            <tr className="bg-[#8da0cd] text-white">
              <th className="px-4 py-3 text-left font-bold">작업자</th>
              <th className="px-4 py-3 text-left font-bold">발행 현장</th>
              <th className="px-4 py-3 text-left font-bold">기준 기간</th>
              <th className="px-4 py-3 text-right font-bold w-40">최종 급여</th>
              <th className="px-4 py-3 text-center font-bold w-32">아카이브</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((r, idx) => (
              <tr key={`${r.worker_id}-${r.work_date}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-bold text-gray-900">{r.worker.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{r.site.name}</td>
                <td className="px-4 py-3 font-black text-indigo-600 italic tabular-nums">{r.work_date}</td>
                <td className="px-4 py-3 text-right font-black text-[#1A254F] italic">
                   ₩{r.base_pay.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    size="xs"
                    className="h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    onClick={() => openPayslip(r)}
                  >
                    <FileCode className="w-3 h-3" />
                    HTML
                  </Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td className="px-4 py-20 text-center text-gray-400" colSpan={5}>
                  조회된 레코드가 없습니다.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td className="px-4 py-20 text-center text-gray-400 animate-pulse" colSpan={5}>
                  데이터를 불러오는 중입니다...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
