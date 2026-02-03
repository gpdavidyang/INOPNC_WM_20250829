'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSiteMaterials } from '../../hooks/useSiteMaterials'
import { InventorySection } from './materials/InventorySection'
import { RequestsSection } from './materials/RequestsSection'
import { ShipmentsSection } from './materials/ShipmentsSection'

interface MaterialsTabProps {
  siteId: string
  tab: string
}

export function MaterialsTab({ siteId, tab }: MaterialsTabProps) {
  const m = useSiteMaterials({ siteId, tab })

  return (
    <div className="mt-4 space-y-8">
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid grid-cols-3 h-auto items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
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
            입고요청
          </TabsTrigger>
          <TabsTrigger
            value="shipments"
            className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-600 transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 whitespace-nowrap"
          >
            출고배송결제
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <InventorySection
            inventory={m.inventory}
            stats={m.materialsStats}
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
      </Tabs>{' '}
    </div>
  )
}
