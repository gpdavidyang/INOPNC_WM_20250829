'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileCode,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Users,
} from 'lucide-react'
import React, { useState } from 'react'
import { AssignmentsTab } from './detail/tabs/AssignmentsTab'
import { DrawingsTab } from './detail/tabs/DrawingsTab'
import { EditSiteTab } from './detail/tabs/EditSiteTab'
import { InvoicesTab } from './detail/tabs/InvoicesTab'
import { MaterialsTab } from './detail/tabs/MaterialsTab'
import { OverviewTab } from './detail/tabs/OverviewTab'
import { PhotosTab } from './detail/tabs/PhotosTab'
import { ReportsTab } from './detail/tabs/ReportsTab'
import { filteredAndSortedAssignments } from './detail/utils'
import { useSiteDetail } from './hooks/useSiteDetail'

interface SiteDetailTabsProps {
  siteId: string
  site: any
  organization?: any
  initialReports?: any[]
  initialAssignments?: any[]
  initialRequests?: any[]
  initialDocs?: any[]
  initialStats?: { reports: number; labor: number } | null
}

export default function SiteDetailTabs({
  siteId,
  site,
  organization,
  initialReports = [],
  initialAssignments = [],
  initialRequests = [],
  initialStats = null,
}: SiteDetailTabsProps) {
  const [tab, setTab] = useState('overview')

  const d = useSiteDetail({
    siteId,
    site,
    initialReports,
    initialAssignments,
    initialRequests,
    initialStats,
  })

  return (
    <div className="w-full space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white to-transparent pb-4 -mx-6 px-6 mb-2">
          <TabsList className="grid grid-cols-8 h-auto items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
            <TabTrigger
              value="overview"
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="개요"
            />
            <TabTrigger value="reports" icon={<FileText className="w-4 h-4" />} label="작업일지" />
            <TabTrigger value="materials" icon={<Package className="w-4 h-4" />} label="자재관리" />
            <TabTrigger value="assignments" icon={<Users className="w-4 h-4" />} label="배정인원" />
            <TabTrigger value="shared" icon={<FileCode className="w-4 h-4" />} label="공유도면" />
            <TabTrigger value="invoices" icon={<Receipt className="w-4 h-4" />} label="기성문서" />
            <TabTrigger value="photos" icon={<ImageIcon className="w-4 h-4" />} label="현장사진" />
            <TabTrigger value="edit" icon={<Settings className="w-4 h-4" />} label="현장편집" />
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewTab
            siteId={siteId}
            site={site}
            organization={organization}
            stats={d.stats}
            statsLoading={d.statsLoading}
            recentReports={d.recentReports}
            reportsLoading={d.reportsLoading}
            recentAssignments={d.recentAssignments}
            assignmentsLoading={d.assignmentsLoading}
            recentRequests={d.recentRequests}
            requestsLoading={d.requestsLoading}
            availableCount={d.availableCount}
            laborByUser={d.laborByUser}
            globalLaborByUser={d.globalLaborByUser}
            invoiceStageSummary={d.invoiceProgress}
            onTabChange={setTab}
            assignmentQuery={d.assignmentQuery}
            setAssignmentQuery={d.setAssignmentQuery}
            assignmentRole={d.assignmentRole}
            setAssignmentRole={d.setAssignmentRole}
            assignmentSort={d.assignmentSort}
            setAssignmentSort={d.setAssignmentSort}
            filteredAndSortedAssignments={filteredAndSortedAssignments}
          />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab siteId={siteId} />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialsTab siteId={siteId} tab={tab} />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentsTab
            siteId={siteId}
            assignments={d.recentAssignments}
            loading={d.assignmentsLoading}
            query={d.assignmentQuery}
            onQueryChange={d.setAssignmentQuery}
            role={d.assignmentRole}
            onRoleChange={d.setAssignmentRole}
            sort={d.assignmentSort}
            onSortChange={d.setAssignmentSort}
            page={d.assignPage}
            onPageChange={d.setAssignPage}
            pageSize={d.assignPageSize}
            onPageSizeChange={d.setAssignPageSize}
            total={d.assignTotal}
            hasNext={d.assignHasNext}
            laborByUser={d.laborByUser}
            globalLaborByUser={d.globalLaborByUser}
            filteredAndSortedAssignments={filteredAndSortedAssignments}
          />
        </TabsContent>

        <TabsContent value="shared">
          <DrawingsTab siteId={siteId} siteName={site?.name} />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesTab
            siteId={siteId}
            siteName={site?.name}
            organizationId={site?.organization_id}
            onProgressUpdate={d.setInvoiceProgress}
          />
        </TabsContent>

        <TabsContent value="photos">
          <PhotosTab siteId={siteId} siteName={site?.name} />
        </TabsContent>

        <TabsContent value="edit">
          <EditSiteTab site={site} onSuccess={() => window.location.reload()} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TabTrigger({
  value,
  icon,
  label,
}: {
  value: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <TabsTrigger
      value={value}
      className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-600 transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 whitespace-nowrap"
    >
      {icon}
      <span>{label}</span>
    </TabsTrigger>
  )
}
