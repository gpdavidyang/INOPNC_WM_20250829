'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSiteMaterials } from '../../hooks/useSiteMaterials'
import { InventorySection } from './materials/InventorySection'
import { RequestsSection } from './materials/RequestsSection'
import { ShipmentsSection } from './materials/ShipmentsSection'
import { TransactionsSection } from './materials/TransactionsSection'

interface MaterialsTabProps {
  siteId: string
  tab: string
}

export function MaterialsTab({ siteId, tab }: MaterialsTabProps) {
  const m = useSiteMaterials({ siteId, tab })

  return (
    <div className="mt-4 space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl bg-blue-50/50 p-4 space-y-2">
          <div className="text-[11px] uppercase font-black tracking-tighter text-blue-600">
            관리 자재
          </div>
          <div className="text-2xl font-black text-blue-700">
            {m.materialsStats.inventory_total}
          </div>
        </div>
        <div className="rounded-xl bg-amber-50/50 p-4 space-y-2">
          <div className="text-[11px] uppercase font-black tracking-tighter text-amber-600">
            재고 부족
          </div>
          <div className="text-2xl font-black text-amber-700">{m.materialsStats.low_stock}</div>
        </div>
        <div className="rounded-xl bg-rose-50/50 p-4 space-y-2">
          <div className="text-[11px] uppercase font-black tracking-tighter text-rose-600">
            재고 소진
          </div>
          <div className="text-2xl font-black text-rose-700">{m.materialsStats.out_of_stock}</div>
        </div>
        <div className="rounded-xl bg-indigo-50/50 p-4 space-y-2">
          <div className="text-[11px] uppercase font-black tracking-tighter text-indigo-600">
            대기 요청
          </div>
          <div className="text-2xl font-black text-indigo-700">
            {m.materialsStats.pending_requests}
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50/50 p-4 space-y-2">
          <div className="text-[11px] uppercase font-black tracking-tighter text-emerald-600">
            진행 배송
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {m.materialsStats.open_shipments}
          </div>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid grid-cols-4 h-auto items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
          <TabsTrigger
            value="inventory"
            className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-600 transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 whitespace-nowrap"
          >
            재고현황
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-600 transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 whitespace-nowrap"
          >
            요청관리
          </TabsTrigger>
          <TabsTrigger
            value="shipments"
            className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-600 transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 whitespace-nowrap"
          >
            반입/배송
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-600 transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 whitespace-nowrap"
          >
            변동이력
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <InventorySection
            inventory={m.inventory}
            loading={m.invLoading}
            query={m.invQuery}
            onQueryChange={m.setInvQuery}
            siteId={siteId}
          />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <RequestsSection
            requests={m.reqRows}
            loading={m.requestsLoading}
            query={m.materialsQuery}
            onQueryChange={m.setMaterialsQuery}
            status={m.materialsStatus}
            onStatusChange={m.setMaterialsStatus}
            sort={m.materialsSort}
            onSortChange={m.setMaterialsSort}
            page={m.reqPage}
            onPageChange={m.setReqPage}
            pageSize={m.reqPageSize}
            onPageSizeChange={m.setReqPageSize}
            total={m.reqTotal}
            hasNext={m.reqHasNext}
          />
        </TabsContent>

        <TabsContent value="shipments" className="mt-6">
          <ShipmentsSection
            shipments={m.shipments}
            loading={m.shipLoading}
            query={m.shipQuery}
            onQueryChange={m.setShipQuery}
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <TransactionsSection
            transactions={m.transactions}
            loading={m.txnLoading}
            query={m.txnQuery}
            onQueryChange={m.setTxnQuery}
            page={m.txnPage}
            onPageChange={m.setTxnPage}
            pageSize={m.txnPageSize}
            onPageSizeChange={m.setTxnPageSize}
            total={m.txnTotal}
            hasNext={m.txnHasNext}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
