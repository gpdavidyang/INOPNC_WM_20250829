'use client'

import StatsCard from '@/components/ui/stats-card'
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
        <StatsCard
          label="관리 자재"
          value={m.materialsStats.inventory_total}
          className="bg-blue-50/50"
        />
        <StatsCard
          label="재고 부족"
          value={m.materialsStats.low_stock}
          className="bg-amber-50/50"
        />
        <StatsCard
          label="재고 소진"
          value={m.materialsStats.out_of_stock}
          className="bg-rose-50/50"
        />
        <StatsCard
          label="대기 요청"
          value={m.materialsStats.pending_requests}
          className="bg-indigo-50/50"
        />
        <StatsCard
          label="진행 배송"
          value={m.materialsStats.open_shipments}
          className="bg-emerald-50/50"
        />
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-xl h-12">
          <TabsTrigger
            value="inventory"
            className="rounded-lg h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            재고현황
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="rounded-lg h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            요청관리
          </TabsTrigger>
          <TabsTrigger
            value="shipments"
            className="rounded-lg h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            반입/배송
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="rounded-lg h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm"
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
