'use client'

import { Card } from '@/components/ui/card'
import { ChevronRight, Image as ImageIcon, Map } from 'lucide-react'
import Link from 'next/link'

interface IntegratedMediaCardProps {
  selectedSite?: string
}

export function IntegratedMediaCard({ selectedSite }: IntegratedMediaCardProps) {
  const getHref = (tab: string) => {
    const params = new URLSearchParams()
    params.set('tab', tab)
    if (selectedSite) params.set('siteId', selectedSite)
    return `/mobile/media?${params.toString()}`
  }

  return (
    <Card className="p-6 rounded-3xl border-none bg-white shadow-xl shadow-blue-900/5">
      <div className="flex flex-col gap-4">
        <Link
          href={getHref('photo')}
          className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/50 hover:bg-blue-100/50 transition-all border border-blue-100 group"
        >
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-blue-900 uppercase">사진 업로드</h4>
            <p className="text-[10px] font-bold text-blue-600/60 uppercase tracking-widest">
              Upload Site Photos
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-blue-300 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href={getHref('drawing')}
          className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/50 transition-all border border-emerald-100 group"
        >
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
            <Map className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-emerald-900 uppercase">도면 마킹</h4>
            <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">
              Mark BaseBlueprints
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </Card>
  )
}
