import React from 'react'
import {
  Map,
  Camera,
  FileText,
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  Phone,
  MapPin,
} from 'lucide-react'
import { ActionButton } from './ActionButton'

export interface Site {
  id: number
  name: string
  status: 'ing' | 'wait' | 'done'
  days: number
  mp: number
  address: string
  worker: number
  affil: string
  manager: string
  safety: string
  lastUpdate: string
  hasDraw: boolean
  hasPhoto: boolean
  hasPTW: boolean
  hasLog: boolean
  hasAction: boolean
}

interface SiteCardProps {
  site: Site
  expanded: boolean
  onToggleExpand: (id: number) => void
  showToast: (msg: string, type?: 'success' | 'warning') => void
  navigate: (path: string) => void
  weather: { icon: React.ReactNode; text: string }
}

export const SiteCard: React.FC<SiteCardProps> = ({
  site,
  expanded,
  onToggleExpand,
  showToast,
  navigate,
  weather,
}) => {
  const handleActionClick = (hasData: boolean, message: string, path?: string) => {
    if (!hasData) {
      showToast(message, 'warning')
    } else if (path) {
      navigate(path)
    }
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl shadow-sm mb-4 overflow-hidden relative z-10 transition-all duration-200 border border-[var(--border)]">
      <span
        className={`absolute top-0 right-0 z-20 text-[13px] font-semibold px-4 rounded-bl-xl text-white ${
          site.status === 'ing'
            ? 'bg-[var(--primary)]'
            : site.status === 'done'
              ? 'bg-slate-500'
              : 'bg-purple-500'
        }`}
        style={{ height: '25px', display: 'flex', alignItems: 'center' }}
      >
        {site.status === 'ing' ? '진행중' : site.status === 'done' ? '완료' : '예정'}
      </span>

      {/* Header Main */}
      <div className="p-4 border-b-0 relative">
        {/* Date */}
        <div className="text-[15px] text-[var(--text-sub)] font-medium mb-2">{site.lastUpdate}</div>

        {/* Title */}
        <div className="flex justify-between items-start mb-4 pr-16">
          <div className="text-[20px] font-extrabold leading-[1.3] mr-2 break-keep flex-1 text-[var(--header-navy)]">
            {site.name}
          </div>
        </div>

        {/* Sub Info */}
        <div className="flex items-center justify-between w-full mb-4 flex-nowrap">
          <div className="flex gap-2 items-center flex-nowrap overflow-hidden min-w-0 flex-1">
            <span className="text-[14px] px-3 h-8 rounded-lg border flex items-center gap-2 font-semibold whitespace-nowrap shrink-0 bg-[var(--tag-affil-bg)] text-[var(--tag-affil-text)] border-[var(--tag-affil-border)]">
              {site.affil.substring(0, 4)}
            </span>
            <span className="text-[14px] px-3 h-8 rounded-lg border bg-[var(--tag-gray-bg)] text-[var(--tag-gray-text)] border-[var(--tag-gray-border)] flex items-center gap-2 font-semibold whitespace-nowrap shrink-0 overflow-hidden text-ellipsis max-w-[140px]">
              {weather.icon} {weather.text}
            </span>
          </div>

          <div className="flex gap-2 items-center pl-3 border-l border-[var(--border)] ml-2 shrink-0">
            <Map
              size={16}
              className={
                site.hasDraw ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'
              }
            />
            <Camera
              size={16}
              className={
                site.hasPhoto ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'
              }
            />
            <FileText
              size={16}
              className={
                site.hasPTW ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'
              }
            />
            <ClipboardList
              size={16}
              className={
                site.hasLog ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'
              }
            />
            <CheckCircle2
              size={16}
              className={
                site.hasAction ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'
              }
            />
          </div>
        </div>

        {/* Address Row */}
        <div className="flex items-center justify-between pt-2">
          <div
            className="flex items-center gap-2 flex-1 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer text-[17px] text-slate-600 font-bold"
            onClick={() => alert('지도 이동')}
          >
            <span>{site.address}</span>
          </div>
          <button
            className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 cursor-pointer shrink-0 active:scale-95"
            onClick={() => alert('지도 이동')}
          >
            <MapPin size={18} />
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="block p-4 bg-[var(--bg-surface)] animate-slideDown">
          {/* 인적 정보 섹션 */}
          <div className="flex flex-wrap justify-between items-center py-3 border-b border-dashed border-slate-200 text-[17px] min-h-[48px] gap-2">
            <span className="flex items-center text-slate-500 font-bold w-20 shrink-0">
              현장소장
            </span>
            <div className="flex items-center gap-2 flex-1 justify-end min-w-0 flex-wrap">
              <span className="font-semibold text-main text-right break-words min-w-[100px] flex items-center justify-end">
                {site.manager}
              </span>
              <button
                className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 cursor-pointer shrink-0 active:scale-95"
                onClick={() => (window.location.href = 'tel:01000000000')}
              >
                <Phone size={18} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center py-3 border-b border-dashed border-slate-200 text-[17px] min-h-[48px] gap-2">
            <span className="flex items-center text-slate-500 font-bold w-20 shrink-0">
              안전담당
            </span>
            <div className="flex items-center gap-2 flex-1 justify-end min-w-0 flex-wrap">
              <span className="font-semibold text-main text-right break-words min-w-[100px] flex items-center justify-end">
                {site.safety}
              </span>
              <button
                className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 cursor-pointer shrink-0 active:scale-95"
                onClick={() => (window.location.href = 'tel:01000000000')}
              >
                <Phone size={18} />
              </button>
            </div>
          </div>

          {/* 작업일 누계 / 누적 출력 */}
          <div className="flex mb-4 border-b border-dashed border-[var(--border)] py-4">
            <div className="flex-1 text-center relative after:content-[''] after:absolute after:right-0 after:top-[10%] after:h-[80%] after:w-[1px] after:bg-[var(--border)]">
              <span className="block text-[15px] text-[var(--text-sub)] mb-2 font-bold">
                작업일 누계
              </span>
              <span className="text-[20px] font-extrabold text-[var(--header-navy)]">
                {site.days}일
              </span>
            </div>
            <div className="flex-1 text-center">
              <span className="block text-[15px] text-[var(--text-sub)] mb-2 font-bold">
                누적 출력
              </span>
              <span className="text-[20px] font-extrabold text-[var(--primary)]">{site.mp}명</span>
            </div>
          </div>

          {/* ACTION GRID */}
          <div className="grid grid-cols-5 gap-2 mt-6">
            <ActionButton
              hasData={site.hasDraw}
              type="draw"
              label="도면"
              onClick={e => {
                e.stopPropagation()
                handleActionClick(site.hasDraw, '등록된 도면이 없습니다', '/site')
              }}
            />
            <ActionButton
              hasData={site.hasPhoto}
              type="photo"
              label="사진"
              onClick={e => {
                e.stopPropagation()
                handleActionClick(site.hasPhoto, '등록된 사진이 없습니다', '/site')
              }}
            />
            <ActionButton
              hasData={site.hasPTW}
              type="ptw"
              label="PTW"
              onClick={e => {
                e.stopPropagation()
                handleActionClick(site.hasPTW, '발급된 PTW가 없습니다', '/site')
              }}
            />
            <ActionButton
              hasData={site.hasLog}
              type="log"
              label="일지"
              onClick={e => {
                e.stopPropagation()
                handleActionClick(site.hasLog, '작성된 작업일지가 없습니다', '/worklog')
              }}
            />
            <ActionButton
              hasData={site.hasAction}
              type="action"
              label="조치"
              onClick={e => {
                e.stopPropagation()
                handleActionClick(site.hasAction, '등록된 조치사항이 없습니다', '/site')
              }}
            />
          </div>
        </div>
      )}

      <div className="border-t border-[var(--border)]" />

      <button
        onClick={() => onToggleExpand(site.id)}
        className="w-full h-12 flex items-center justify-center gap-2 text-text-sub text-[14px] font-medium transition-colors duration-200"
      >
        {!expanded && <span>상세 정보 보기</span>}
        {expanded && <span>상세 정보 접기</span>}
        <ChevronDown
          size={18}
          className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  )
}
