import React from 'react'
import {
  Map,
  Camera,
  FileCheck2,
  ClipboardList,
  CheckCircle2,
  MapPin,
  Phone,
  Plus,
  Trash2,
  ChevronDown,
  Pin,
  Cloud,
  Sun,
  CloudRain,
} from 'lucide-react'
import { Site } from '@inopnc/shared/types'
import { WEATHER_DATA, DEFAULT_WEATHER } from '../constants'

interface SiteCardProps {
  site: Site
  expanded: boolean
  onToggleExpand: (id: number) => void
  onTogglePin: (id: number, e: React.MouseEvent) => void
  onDelete: (id: number, e: React.MouseEvent) => void
  onEdit: (id: number, field: keyof Site, e: React.MouseEvent) => void
  onActionClick: (site: Site, type: string) => void
}

export const SiteCard: React.FC<SiteCardProps> = ({
  site,
  expanded,
  onToggleExpand,
  onTogglePin,
  onDelete,
  onEdit,
  onActionClick,
}) => {
  // 1. Status Colors Logic (Badge Only)
  const statusStyles = {
    ing: {
      badge: 'bg-blue-500',
      badgeText: '진행중',
    },
    wait: {
      badge: 'bg-purple-500',
      badgeText: '예정',
    },
    done: {
      badge: 'bg-slate-500',
      badgeText: '완료',
    },
  }

  const currentStyle = statusStyles[site.status]

  // Weather Logic
  const getWeather = (addr: string) => {
    if (!addr) return DEFAULT_WEATHER
    const regionKey = Object.keys(WEATHER_DATA).find(key => addr.includes(key))
    return regionKey ? WEATHER_DATA[regionKey] : DEFAULT_WEATHER
  }
  const weather = getWeather(site.addr)

  const WeatherIcon =
    {
      cloud: Cloud,
      sun: Sun,
      'cloud-rain': CloudRain,
    }[weather.icon as string] || Sun

  // Checks
  const hasDraw = !!(
    site.drawings.construction.length ||
    site.drawings.progress.length ||
    site.drawings.completion.length
  )
  const hasPhoto = site.images.length > 0
  const hasPTW = !!site.ptw
  const hasLog = !!site.workLog
  const hasAction = !!site.punch

  // Handlers
  const handlePhone = (e: React.MouseEvent, type: 'phoneM' | 'phoneS') => {
    e.stopPropagation()
    const num = site[type]
    if (site.isLocal) {
      onEdit(site.id, type, e)
    } else {
      if (num && num.length > 5) window.location.href = `tel:${num}`
    }
  }

  const handleAddr = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (site.isLocal) onEdit(site.id, 'addr', e)
    else if (site.addr && site.addr.length > 1)
      window.open(`https://map.naver.com/v5/search/${encodeURIComponent(site.addr)}`)
  }

  const handleLodge = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (site.isLocal) onEdit(site.id, 'lodge', e)
    else if (site.lodge && site.lodge !== '-')
      window.open(`https://map.naver.com/v5/search/${encodeURIComponent(site.lodge)}`)
  }

  return (
    <div
      className={`
                bg-[var(--bg-surface)] rounded-[16px] shadow-sm mb-4 overflow-hidden relative z-[1] transition-all duration-200
                border border-[var(--border)]
                ${site.pinned ? 'border-primary ring-1 ring-primary/20' : ''}
            `}
      onClick={() => onToggleExpand(site.id)}
    >
      {/* Badge */}
      <span
        className={`
                    absolute top-0 right-0 z-10 text-[13px] font-semibold px-3.5 py-1.5 rounded-bl-xl
                    text-white inline-flex items-center justify-center leading-none
                    ${currentStyle.badge}
                `}
        style={{
          margin: 0,
          borderRadius: '0 0 0 12px',
          border: 'none',
        }}
      >
        {currentStyle.badgeText}
      </span>

      {/* Action Column (Delete left of Pin) */}
      <div className="absolute top-12 right-[18px] z-10 flex flex-row items-center gap-3 justify-end">
        {(site.isLocal || site.affil === '직접') && (
          <button
            className="bg-none border-none p-1 text-red-500 cursor-pointer flex items-center justify-center transition-transform active:scale-95"
            onClick={e => onDelete(site.id, e)}
          >
            <Trash2 size={20} />
          </button>
        )}
        <button
          className={`bg-none border-none cursor-pointer flex items-center justify-center p-1 transition-transform duration-200 ${site.pinned ? 'text-[var(--primary)] -rotate-45' : 'text-[var(--text-placeholder)]'}`}
          onClick={e => onTogglePin(site.id, e)}
        >
          <Pin size={20} />
        </button>
      </div>

      {/* Header Main */}
      <div className="p-4 border-b-0 relative">
        {/* Date */}
        {site.lastDate && (
          <div className="text-[15px] text-[var(--text-sub)] font-medium mb-2">
            {site.lastDate} {site.lastTime ? `(최종 ${site.lastTime})` : ''}
          </div>
        )}

        {/* Title */}
        <div className="flex justify-between items-start mb-4 pr-16">
          <div className="text-[20px] font-extrabold leading-[1.3] mr-2 break-keep flex-1 text-[var(--header-navy)]">
            {site.name}
          </div>
        </div>

        {/* Sub Info */}
        <div className="flex items-center justify-between w-full mb-4 flex-nowrap">
          <div className="flex gap-2 items-center flex-nowrap overflow-hidden min-w-0 flex-1">
            <span
              className={`
                            text-[14px] px-3 h-8 rounded-lg border flex items-center gap-2 font-semibold whitespace-nowrap shrink-0
                            ${
                              site.affil === '직접등록' || site.affil === '직접'
                                ? 'bg-[var(--del-btn-bg)] text-[var(--danger)] border-[var(--danger)]/30'
                                : 'bg-[var(--tag-affil-bg)] text-[var(--tag-affil-text)] border-[var(--tag-affil-border)]'
                            }
                        `}
            >
              {site.affil.substring(0, 4)}
            </span>
            <span className="text-[14px] px-3 h-8 rounded-lg border bg-[var(--tag-gray-bg)] text-[var(--tag-gray-text)] border-[var(--tag-gray-border)] flex items-center gap-2 font-semibold whitespace-nowrap shrink-0 overflow-hidden text-ellipsis max-w-[140px]">
              <WeatherIcon size={14} /> {weather.text}
            </span>
          </div>

          <div className="flex gap-2 items-center pl-3 border-l border-[var(--border)] ml-2 shrink-0">
            <Map
              size={16}
              className={hasDraw ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'}
            />
            <Camera
              size={16}
              className={hasPhoto ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'}
            />
            <FileCheck2
              size={16}
              className={hasPTW ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'}
            />
            <ClipboardList
              size={16}
              className={hasLog ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'}
            />
            <CheckCircle2
              size={16}
              className={hasAction ? 'text-[var(--header-navy)]' : 'text-[var(--text-placeholder)]'}
            />
          </div>
        </div>

        {/* Address Row */}
        <div className="flex items-center justify-between pt-2">
          <div
            className="flex items-center gap-2 flex-1 overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer text-[17px] text-slate-600 font-bold"
            onClick={handleAddr}
          >
            <span>{site.addr && site.addr.length > 1 ? site.addr : '주소 입력(클릭)'}</span>
          </div>
          <button
            className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 cursor-pointer shrink-0 active:scale-95"
            onClick={handleAddr}
          >
            <MapPin size={18} />
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div className="block p-4 bg-[var(--bg-surface)] animate-slideDown">
          {/* 인적 정보 섹션: 모바일 최적화 (flex-wrap, 반응형 폰트) */}
          <div className="flex flex-wrap justify-between items-center py-3 border-b border-dashed border-slate-200 text-[17px] min-h-[48px] gap-2 max-[360px]:text-[14px]">
            <span className="flex items-center text-slate-500 font-bold w-20 shrink-0 max-[360px]:w-[70px]">
              현장소장
            </span>
            <div className="flex items-center gap-2 flex-1 justify-end min-w-0 flex-wrap">
              <span
                className="font-semibold text-main text-right break-words min-w-[100px] flex items-center justify-end max-[360px]:min-w-[80px]"
                onClick={e => {
                  e.stopPropagation()
                  if (site.isLocal) onEdit(site.id, 'manager', e)
                }}
              >
                {site.manager || '입력'}
              </span>
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-95 ${site.isLocal && !site.phoneM ? 'bg-transparent border border-dashed border-slate-200 text-slate-400' : 'bg-blue-50 border border-blue-100 text-blue-900'}`}
                onClick={e => handlePhone(e, 'phoneM')}
              >
                {!site.isLocal || (site.phoneM && site.phoneM.length > 5) ? (
                  <Phone size={18} />
                ) : (
                  <Plus size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center py-3 border-b border-dashed border-slate-200 text-[17px] min-h-[48px] gap-2 max-[360px]:text-[14px]">
            <span className="flex items-center text-slate-500 font-bold w-20 shrink-0 max-[360px]:w-[70px]">
              안전담당
            </span>
            <div className="flex items-center gap-2 flex-1 justify-end min-w-0 flex-wrap">
              <span
                className="font-semibold text-main text-right break-words min-w-[100px] flex items-center justify-end max-[360px]:min-w-[80px]"
                onClick={e => {
                  e.stopPropagation()
                  if (site.isLocal) onEdit(site.id, 'safety', e)
                }}
              >
                {site.safety || '입력'}
              </span>
              <button
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-95 ${site.isLocal && !site.phoneS ? 'bg-transparent border border-dashed border-slate-200 text-slate-400' : 'bg-blue-50 border border-blue-100 text-blue-900'}`}
                onClick={e => handlePhone(e, 'phoneS')}
              >
                {!site.isLocal || (site.phoneS && site.phoneS.length > 5) ? (
                  <Phone size={18} />
                ) : (
                  <Plus size={18} />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center py-3 border-dashed border-slate-200 text-[17px] min-h-[48px] gap-2 max-[360px]:text-[14px]">
            <span className="flex items-center text-slate-500 font-bold w-20 shrink-0 max-[360px]:w-[70px]">
              숙소
            </span>
            <div className="flex items-center gap-2 flex-1 justify-end min-w-0 flex-wrap">
              <span
                className={`font-semibold text-main text-right break-words min-w-[100px] flex items-center justify-end max-[360px]:min-w-[80px] ${site.isLocal || (site.lodge && site.lodge !== '-') ? 'cursor-pointer' : ''}`}
                onClick={handleLodge}
              >
                {site.lodge || '-'}
              </span>
              {(site.isLocal || (site.lodge && site.lodge !== '-')) && (
                <button
                  className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 cursor-pointer shrink-0 active:scale-95"
                  onClick={handleLodge}
                >
                  <MapPin size={18} />
                </button>
              )}
            </div>
          </div>

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
                하자(미조치)
              </span>
              <span className="text-[20px] font-extrabold text-[var(--danger)]">{site.mp}건</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 mt-6">
            <ActionButton
              icon={<Map size={24} />}
              label="도면"
              hasData={hasDraw}
              type="draw"
              onClick={() => onActionClick(site, 'draw')}
            />
            <ActionButton
              icon={<Camera size={24} />}
              label="사진"
              hasData={hasPhoto}
              type="photo"
              onClick={() => onActionClick(site, 'photo')}
            />
            <ActionButton
              icon={<FileCheck2 size={24} />}
              label="PTW"
              hasData={hasPTW}
              type="ptw"
              onClick={() => onActionClick(site, 'ptw')}
            />
            <ActionButton
              icon={<ClipboardList size={24} />}
              label="일지"
              hasData={hasLog}
              type="log"
              onClick={() => onActionClick(site, 'log')}
            />
            <ActionButton
              icon={<CheckCircle2 size={24} />}
              label="조치"
              hasData={hasAction}
              type="action"
              onClick={() => onActionClick(site, 'action')}
            />
          </div>
        </div>
      )}

      <div className="border-t border-[var(--border)]" />

      <button
        onClick={() => onToggleExpand(site.id)}
        className={`w-full h-12 flex items-center justify-center gap-2 text-text-sub text-[14px] font-medium transition-colors duration-200`}
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

const ActionButton: React.FC<{
  icon: React.ReactNode
  label: string
  hasData: boolean
  type: string
  onClick: () => void
}> = ({ icon, label, hasData, type, onClick }) => {
  let colorClass = ''

  // 비활성화 상태: 통일된 회색 스타일 (사이언3 그레이톤 배경, 사이언3 그레이 텍스트/아이콘)
  if (!hasData) {
    colorClass = 'bg-[var(--badge-gray-bg)] text-[var(--text-placeholder)] cursor-pointer'
  } else {
    switch (type) {
      case 'draw':
        colorClass =
          'bg-[var(--act-draw-bg)] border border-[var(--act-draw-border)] text-[var(--act-draw-text)] active:scale-95 cursor-pointer'
        break
      case 'photo':
        colorClass =
          'bg-[var(--st-wait-bg)] border border-[var(--st-wait-border)] text-[var(--st-wait-text)] active:scale-95 cursor-pointer'
        break
      case 'ptw':
        colorClass =
          'bg-[var(--act-ptw-bg)] border border-[var(--act-ptw-border)] text-[var(--act-ptw-text)] active:scale-95 cursor-pointer'
        break
      case 'log':
        colorClass =
          'bg-[var(--act-log-bg)] border border-[var(--act-log-border)] text-[var(--act-log-text)] active:scale-95 cursor-pointer'
        break
      case 'action':
        colorClass =
          'bg-[var(--del-btn-bg)] border border-[var(--danger)]/30 text-[var(--danger)] active:scale-95 cursor-pointer'
        break
      default:
        colorClass =
          'bg-[var(--badge-gray-bg)] text-[var(--text-placeholder)] active:scale-95 cursor-pointer'
    }
  }

  return (
    <button
      className={`flex flex-col items-center justify-center gap-1.5 h-[74px] rounded-xl transition-all duration-200 outline-none border-none ${colorClass}`}
      onClick={e => {
        e.stopPropagation()
        if (!hasData) {
          e.preventDefault()
          // 토스트는 상위 컴포넌트에서 처리
        }
        onClick()
      }}
    >
      <div className={!hasData ? 'text-[var(--text-placeholder)]' : ''}>{icon}</div>
      <span
        className={`text-[14px] font-bold tracking-tighter ${!hasData ? 'text-[var(--text-placeholder)]' : ''}`}
      >
        {label}
      </span>
    </button>
  )
}
