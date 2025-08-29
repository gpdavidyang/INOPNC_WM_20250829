'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useFontSize, getTypographyClass , getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  Search, 
  Filter,
  ArrowUpDown,
  Building2,
  FileText,
  Truck,
  Package
} from 'lucide-react'
import { MaterialInventory } from './material-inventory'
import { MaterialRequests } from './material-requests'
import { MaterialTransactions } from './material-transactions'
import { NPC1000Management } from './npc1000-management'

interface MaterialManagementProps {
  materials: any[]
  categories: any[]
  initialInventory: any[]
  currentUser: any
  currentSite?: any
}

export function MaterialManagement({ materials, categories, initialInventory, currentUser, currentSite }: MaterialManagementProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [activeTab, setActiveTab] = useState('npc1000')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-3">

      {/* Search and Filters - Compact */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 ${
            touchMode === 'glove' ? 'h-4 w-4' : 'h-3.5 w-3.5'
          } text-gray-400`} />
          <Input
            type="text"
            placeholder="자재명, 자재코드로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`pl-9 ${
              touchMode === 'glove' ? 'h-10' : 'h-9'
            } ${getFullTypographyClass('body', 'sm', isLargeFont)}`}
          />
        </div>
        <Button variant="outline" className={`gap-1.5 ${
          touchMode === 'glove' ? 'h-10 px-3' : 'h-9 px-2.5'
        }`}>
          <Filter className={`${
            touchMode === 'glove' ? 'h-4 w-4' : 'h-3.5 w-3.5'
          }`} />
          <span className={getFullTypographyClass('caption', 'sm', isLargeFont)}>필터</span>
        </Button>
        <Button variant="outline" className={`gap-1.5 ${
          touchMode === 'glove' ? 'h-10 px-3' : 'h-9 px-2.5'
        }`}>
          <ArrowUpDown className={`${
            touchMode === 'glove' ? 'h-4 w-4' : 'h-3.5 w-3.5'
          }`} />
          <span className={getFullTypographyClass('caption', 'sm', isLargeFont)}>정렬</span>
        </Button>
      </div>

      {/* Main Content Tabs - Compact */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          <TabsTrigger value="npc1000" className={`gap-1 ${
            touchMode === 'glove' ? 'min-h-[48px] py-3 px-2' : 'min-h-[40px] py-2 px-1.5'
          } flex-col sm:flex-row`}>
            <Package className={`${
              touchMode === 'glove' ? 'h-4 w-4' : 'h-3.5 w-3.5'
            }`} />
            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-center`}>NPC-1000</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className={`gap-1 ${
            touchMode === 'glove' ? 'min-h-[48px] py-3 px-2' : 'min-h-[40px] py-2 px-1.5'
          } flex-col sm:flex-row`}>
            <Building2 className={`${
              touchMode === 'glove' ? 'h-4 w-4' : 'h-3.5 w-3.5'
            }`} />
            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-center`}>재고</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className={`gap-1 ${
            touchMode === 'glove' ? 'min-h-[48px] py-3 px-2' : 'min-h-[40px] py-2 px-1.5'
          } flex-col sm:flex-row`}>
            <FileText className={`${
              touchMode === 'glove' ? 'h-4 w-4' : 'h-3.5 w-3.5'
            }`} />
            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-center`}>요청</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className={`gap-1 ${
            touchMode === 'glove' ? 'min-h-[48px] py-3 px-2' : 'min-h-[40px] py-2 px-1.5'
          } flex-col sm:flex-row`}>
            <Truck className={`${
              touchMode === 'glove' ? 'h-4 w-4' : 'h-3.5 w-3.5'
            }`} />
            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-center`}>입출고</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="npc1000" className="space-y-4">
          <NPC1000Management 
            currentSite={currentSite}
            currentUser={currentUser}
          />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <MaterialInventory 
            materials={materials}
            initialInventory={initialInventory}
            currentUser={currentUser}
            currentSite={currentSite}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <MaterialRequests 
            materials={materials}
            currentUser={currentUser}
            currentSite={currentSite}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <MaterialTransactions 
            materials={materials}
            currentUser={currentUser}
            currentSite={currentSite}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}