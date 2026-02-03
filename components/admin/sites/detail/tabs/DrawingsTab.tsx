'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { fetchSignedUrlForRecord } from '@/lib/files/preview'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Download, ExternalLink, Eye, FileDigit, FileText, PencilRuler } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useSiteDrawings } from '../../hooks/useSiteDrawings'

interface DrawingsTabProps {
  siteId: string
}

export function DrawingsTab({ siteId }: DrawingsTabProps) {
  const { drawings, markups, loading } = useSiteDrawings(siteId)
  const [activeTab, setActiveTab] = useState<'blueprints' | 'markups'>('blueprints')

  const handleDownload = async (url: string, filename: string) => {
    try {
      const signedUrl = await fetchSignedUrlForRecord(
        { file_url: url, file_name: filename },
        { downloadName: filename }
      )
      const a = document.createElement('a')
      a.href = signedUrl
      a.click()
    } catch (e) {
      toast.error('파일 다운로드에 실패했습니다.')
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
            도면 및 문서 관리
          </h2>
          <p className="text-xs text-muted-foreground">
            공유된 원본 도면과 마킹 작업이 완료된 문서를 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl border">
          <Button
            variant={activeTab === 'blueprints' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('blueprints')}
            className="rounded-xl font-bold h-9 px-4 gap-2"
          >
            <FileText className="w-4 h-4" /> 원본 도면
            <Badge variant="secondary" className="bg-white/50 text-[10px] h-4 px-1">
              {drawings.length}
            </Badge>
          </Button>
          <Button
            variant={activeTab === 'markups' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('markups')}
            className="rounded-xl font-bold h-9 px-4 gap-2"
          >
            <PencilRuler className="w-4 h-4" /> 도면 마킹
            <Badge variant="secondary" className="bg-white/50 text-[10px] h-4 px-1">
              {markups.length}
            </Badge>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <LoadingSpinner />
          <p className="text-xs font-bold text-muted-foreground animate-pulse">
            데이터를 불러오는 중입니다...
          </p>
        </div>
      ) : activeTab === 'blueprints' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drawings.length === 0 ? (
            <EmptyState message="공유된 원본 도면이 없습니다." />
          ) : (
            drawings.map(doc => (
              <DrawingCard
                key={doc.id}
                doc={doc}
                onDownload={handleDownload}
                onView={() => window.open(doc.file_url, '_blank')}
              />
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markups.length === 0 ? (
            <EmptyState message="저장된 도면 마킹이 없습니다." />
          ) : (
            markups.map(doc => (
              <MarkupCard
                key={doc.id}
                doc={doc}
                onEdit={() =>
                  window.open(`/dashboard/admin/documents/markup/${doc.id}/edit`, '_blank')
                }
                onView={() =>
                  window.open(`/dashboard/markup?document=${doc.id}&mode=view`, '_blank')
                }
              />
            ))
          )}
        </div>
      )}

      {/* Quick Access to Tools */}
      <div className="pt-8 border-t">
        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">
          Quick Tools
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ToolCard
            title="도면 신규 마킹"
            description="원본 도면을 선택하여 새로운 마킹 작업을 시작합니다."
            icon={<PencilRuler className="w-6 h-6" />}
            href={`/dashboard/admin/tools/markup?site_id=${siteId}`}
            color="blue"
          />
          <ToolCard
            title="문서 보관함"
            description="전체 도면 및 마킹 파일 목록을 상세 조회합니다."
            icon={<FileDigit className="w-6 h-6" />}
            href={`/dashboard/admin/documents/markup?site_id=${siteId}`}
            color="emerald"
          />
        </div>
      </div>
    </div>
  )
}

function DrawingCard({ doc, onDownload, onView }: any) {
  return (
    <div className="group relative bg-card border rounded-2xl p-4 hover:border-blue-500 transition-all shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
          <FileText className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate">{doc.file_name}</p>
          <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60 mt-0.5">
            {doc.category || 'Shared Drawing'}
          </p>

          <div className="flex items-center gap-1 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onView}
              className="h-8 rounded-lg text-[10px] font-bold gap-1.5 px-3"
            >
              <Eye className="w-3 h-3" /> 보기
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload(doc.file_url, doc.file_name)}
              className="h-8 rounded-lg text-[10px] font-bold gap-1.5 px-3"
            >
              <Download className="w-3 h-3" /> 다운로드
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MarkupCard({ doc, onEdit, onView }: any) {
  return (
    <div className="group relative bg-card border rounded-2xl p-4 hover:border-emerald-500 transition-all shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
          <PencilRuler className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate">{doc.title || 'Untitled Markup'}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge
              variant="outline"
              className="text-[9px] h-4 font-black uppercase tracking-tighter border-emerald-100 text-emerald-700 bg-emerald-50/50"
            >
              {doc.status || 'Draft'}
            </Badge>
            <span className="text-[9px] font-bold text-muted-foreground">
              {doc.updated_at ? format(new Date(doc.updated_at), 'MM-dd HH:mm') : '-'}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={onView}
              className="h-8 rounded-lg text-[10px] font-bold gap-1.5 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none shadow-none"
            >
              <Eye className="w-3 h-3" /> 뷰어
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 rounded-lg text-[10px] font-bold gap-1.5 px-3"
            >
              <ExternalLink className="w-3 h-3" /> 편집
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToolCard({ title, description, icon, href, color }: any) {
  const colorClasses =
    {
      blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-400 shadow-blue-500/5',
      emerald:
        'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-400 shadow-emerald-500/5',
    }[color as 'blue' | 'emerald'] || ''

  return (
    <a
      href={href}
      className={cn(
        'group p-6 rounded-2xl border-2 transition-all flex items-start gap-4 bg-white shadow-lg',
        colorClasses
      )}
    >
      <div className="p-3 rounded-xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-black text-sm uppercase tracking-tight text-gray-900">{title}</h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{description}</p>
      </div>
    </a>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2">
      <FileText className="w-8 h-8 text-gray-200" />
      <p className="text-sm font-bold text-muted-foreground">{message}</p>
    </div>
  )
}
