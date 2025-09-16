'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Search, X, Download, Maximize2, ChevronDown, ChevronUp, Plus } from 'lucide-react'

// Types
interface SiteInfo {
  id: string
  name: string
  manager: string
  phone1: string
  phone2?: string
  address: string
  lodging: string
  subtitle?: string
  process?: string
  workType?: string
  block?: string
  building?: string
  unit?: string
  duration?: string
  photosBefore?: number
  photosAfter?: number
  lastUpdate?: string
}

interface AttachmentFile {
  name: string
  type: string
  size: string
  date: string
  category: 'drawing' | 'ptw' | 'other'
}

interface NPCSite {
  id: string
  name: string
  initialStock: number
  logs: NPCLog[]
}

interface NPCLog {
  date: string
  type: 'in' | 'out'
  qty: number
  memo: string
}

interface NPCRequest {
  siteName: string
  qty: number
  reason: string
  date: string
  status: string
}

export default function SiteInfoPage() {
  // States
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSite, setSelectedSite] = useState<SiteInfo | null>(null)
  const [showAttachmentPopup, setShowAttachmentPopup] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewFile, setPreviewFile] = useState<AttachmentFile | null>(null)
  const [expandedField, setExpandedField] = useState<string | null>(null)
  const [selectedSiteName, setSelectedSiteName] = useState<string | null>(null)
  const [npcCurrent, setNpcCurrent] = useState<NPCSite | null>(null)
  const [showNpcLogModal, setShowNpcLogModal] = useState(false)
  const [showNpcRecordModal, setShowNpcRecordModal] = useState(false)
  const [showNpcRequestModal, setShowNpcRequestModal] = useState(false)
  const [showNpcAddMenu, setShowNpcAddMenu] = useState(false)
  const [npcFormData, setNpcFormData] = useState({
    site: '',
    date: '',
    type: 'in' as 'in' | 'out',
    qty: 1,
    memo: '',
  })
  const [npcRequestData, setNpcRequestData] = useState({
    site: '',
    qty: 1,
    memo: '',
  })

  // Sample data
  const sampleSites: SiteInfo[] = [
    {
      id: '1',
      name: '삼성전자 평택캠퍼스 P3',
      manager: '김현장',
      phone1: '010-1234-5678',
      phone2: '031-1234-5678',
      address: '경기도 평택시 삼성로 1길 1',
      lodging: '평택 비즈니스호텔 (031-123-4567)',
      subtitle: '슬라브',
      process: '균열, 면',
      workType: '지하',
      block: 'A1',
      building: '01',
      unit: '0101',
      duration: '1일',
      photosBefore: 3,
      photosAfter: 2,
      lastUpdate: '2025-01-15',
    },
    {
      id: '2',
      name: 'LG디스플레이 파주공장',
      manager: '이관리',
      phone1: '010-2345-6789',
      address: '경기도 파주시 산업로 123',
      lodging: '파주 게스트하우스 (031-987-6543)',
      lastUpdate: '2025-01-14',
    },
  ]

  const npcSites: NPCSite[] = [
    {
      id: 'b',
      name: 'site3',
      initialStock: 300,
      logs: [
        { date: '2025-01-14', type: 'out', qty: 50, memo: '파일기초' },
        { date: '2025-01-15', type: 'out', qty: 60, memo: '양생보강' },
      ],
    },
    {
      id: 'c',
      name: 'site4',
      initialStock: 0,
      logs: [
        { date: '2025-01-15', type: 'in', qty: 300, memo: '긴급 입고' },
        { date: '2025-01-15', type: 'out', qty: 60, memo: '타설 1구역' },
      ],
    },
    {
      id: 'd',
      name: 'site5',
      initialStock: 500,
      logs: [
        { date: '2025-01-15', type: 'out', qty: 80, memo: '기초공사' },
        { date: '2025-01-15', type: 'in', qty: 150, memo: '정기 입고' },
      ],
    },
    {
      id: 'e',
      name: 'NPC-1000',
      initialStock: 200,
      logs: [
        { date: '2025-01-15', type: 'out', qty: 30, memo: '슬라브 공사' },
        { date: '2025-01-15', type: 'in', qty: 100, memo: '긴급 납품' },
      ],
    },
    {
      id: 'f',
      name: 'NPC-1001',
      initialStock: 150,
      logs: [
        { date: '2025-01-15', type: 'out', qty: 25, memo: '유지보수' },
        { date: '2025-01-15', type: 'in', qty: 80, memo: '정기 점검' },
      ],
    },
  ]

  const [npcRequests, setNpcRequests] = useState<NPCRequest[]>([])

  const sampleAttachments: AttachmentFile[] = [
    { name: '현장배치도.pdf', type: 'pdf', size: '2.5MB', date: '2025-01-15', category: 'drawing' },
    { name: '구조도면.dwg', type: 'dwg', size: '5.2MB', date: '2025-01-14', category: 'drawing' },
    { name: 'PTW-001.pdf', type: 'pdf', size: '1.2MB', date: '2025-01-15', category: 'ptw' },
    { name: '현장사진.jpg', type: 'jpg', size: '850KB', date: '2025-01-15', category: 'other' },
  ]

  // Utility functions
  const formatNumber = (num: number) => num.toLocaleString('ko-KR')
  const formatDate = (date: string | Date) => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toISOString().slice(0, 10)
  }

  const getFileIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      pdf: '문서함.png',
      dwg: '사진대지.png',
      jpg: '사진대지.png',
      jpeg: '사진대지.png',
      png: '사진대지.png',
    }
    return iconMap[type.toLowerCase()] || '문서함.png'
  }

  // NPC calculation functions
  const calculateNpcKPI = useCallback((site: NPCSite | null) => {
    if (!site) return { inQty: 0, used: 0, currentStock: 0 }

    const today = formatDate(new Date())
    const inQty = site.logs
      .filter(l => l.type === 'in' && l.date === today)
      .reduce((a, b) => a + b.qty, 0)
    const used = site.logs
      .filter(l => l.type === 'out' && l.date === today)
      .reduce((a, b) => a + b.qty, 0)

    const totalIn = site.logs.filter(l => l.type === 'in').reduce((a, b) => a + b.qty, 0)
    const totalUsed = site.logs.filter(l => l.type === 'out').reduce((a, b) => a + b.qty, 0)
    const currentStock = (site.initialStock || 0) + totalIn - totalUsed

    return { inQty, used, currentStock }
  }, [])

  // Initialize from localStorage (matching HTML behavior)
  useEffect(() => {
    const storedSiteName = localStorage.getItem('state_site')
    const storedAuthor = localStorage.getItem('inopnc_author')
    const storedOrg = localStorage.getItem('orgName')
    const storedAddress = localStorage.getItem('address')
    const storedLodging = localStorage.getItem('lodging')

    if (storedSiteName) {
      const site = sampleSites.find(s => s.name === storedSiteName)
      if (site) {
        setSelectedSite(site)
        setSelectedSiteName(storedSiteName)
        updateNpcForSite(storedSiteName)
      }
    }
  }, [])

  // Update NPC data for selected site
  const updateNpcForSite = (siteName: string) => {
    const site = npcSites.find(s => s.name === siteName)
    if (site) {
      setNpcCurrent(site)
      setSelectedSiteName(siteName)
    } else {
      setNpcCurrent(npcSites[0])
      setSelectedSiteName(npcSites[0].name)
    }
  }

  // Event handlers
  const handleSiteSelect = (site: SiteInfo) => {
    setSelectedSite(site)
    setSelectedSiteName(site.name)
    setIsSearchMode(false)
    setSearchQuery('')
    updateNpcForSite(site.name)

    // Store in localStorage like HTML version
    localStorage.setItem('state_site', site.name)
    localStorage.setItem('inopnc_author', site.manager)
    localStorage.setItem('orgName', site.name)
    localStorage.setItem('address', site.address)
    localStorage.setItem('lodging', site.lodging)

    setShowAttachmentPopup(true)
  }

  const handlePhoneCall = (phoneNumber: string) => {
    if (phoneNumber && phoneNumber !== '-') {
      window.location.href = `tel:${phoneNumber}`
    } else {
      alert('전화번호가 없습니다.')
    }
  }

  const handleCopyText = async (text: string) => {
    if (text && text !== '-') {
      try {
        await navigator.clipboard.writeText(text)
        alert('복사되었습니다.')
      } catch (e) {
        alert('복사 실패: 권한을 확인하세요.')
      }
    } else {
      alert('복사할 내용이 없습니다.')
    }
  }

  const handleOpenTmap = (address: string) => {
    if (address && address !== '-') {
      const tmapScheme = `tmap://search?name=${encodeURIComponent(address)}`
      const tmapWebUrl = `https://tmapapi.sktelecom.com/main/map.html?q=${encodeURIComponent(address)}`
      const kakaoMapUrl = `https://map.kakao.com/?q=${encodeURIComponent(address)}`

      try {
        const link = document.createElement('a')
        link.href = tmapScheme
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setTimeout(() => {
          const useTmapWeb = confirm(
            'T맵 앱이 설치되어 있지 않습니다.\n\n"확인"을 누르면 T맵 웹으로 이동합니다.\n"취소"를 누르면 카카오맵으로 이동합니다.'
          )

          if (useTmapWeb) {
            window.open(tmapWebUrl, '_blank')
          } else {
            window.open(kakaoMapUrl, '_blank')
          }
        }, 1000)
      } catch (error) {
        console.error('T맵 연결 오류:', error)
        window.open(kakaoMapUrl, '_blank')
      }
    } else {
      alert('주소 정보가 없습니다.')
    }
  }

  const handleFilePreview = (file: AttachmentFile) => {
    setPreviewFile(file)
    setShowPreview(true)
  }

  const handleDownloadFile = (fileName: string) => {
    alert(`${fileName} 다운로드가 시작됩니다.`)
    console.log('파일 다운로드:', fileName)
  }

  // NPC event handlers
  const handleNpcRecord = () => {
    if (!selectedSiteName) {
      alert('현장을 먼저 선택해주세요.')
      return
    }
    setNpcFormData({
      site: selectedSiteName,
      date: formatDate(new Date()),
      type: 'in',
      qty: 1,
      memo: '',
    })
    setShowNpcRecordModal(true)
  }

  const handleNpcRequest = () => {
    if (!selectedSiteName) {
      alert('현장을 먼저 선택해주세요.')
      return
    }
    setNpcRequestData({
      site: selectedSiteName,
      qty: 1,
      memo: '',
    })
    setShowNpcRequestModal(true)
  }

  const handleSaveNpcRecord = () => {
    const site = npcSites.find(s => s.name === npcFormData.site)
    if (!site) {
      alert('현장을 선택해주세요.')
      return
    }

    if (npcFormData.qty <= 0) {
      alert('수량을 입력해주세요.')
      return
    }

    site.logs.push({
      date: npcFormData.date || formatDate(new Date()),
      type: npcFormData.type,
      qty: npcFormData.qty,
      memo: npcFormData.memo.trim(),
    })

    if (site.id === npcCurrent?.id) {
      setNpcCurrent({ ...site })
    }

    setShowNpcRecordModal(false)
    alert('기록이 저장되었습니다.')
  }

  const handleSubmitNpcRequest = () => {
    if (!npcRequestData.site) {
      alert('현장을 선택해주세요.')
      return
    }

    if (npcRequestData.qty <= 0) {
      alert('요청 수량을 입력해주세요.')
      return
    }

    const newRequest: NPCRequest = {
      siteName: npcRequestData.site,
      qty: npcRequestData.qty,
      reason: npcRequestData.memo.trim(),
      date: formatDate(new Date()),
      status: '요청됨',
    }

    setNpcRequests(prev => [...prev, newRequest])
    setShowNpcRequestModal(false)
    alert('자재 요청이 제출되었습니다.')
  }

  // Filter sites based on search
  const filteredSites = sampleSites.filter(
    site =>
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.manager.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get NPC KPI data
  const npcKPI = calculateNpcKPI(npcCurrent)

  return (
    <div className="site-container">
      <style jsx>{`
        .site-container {
          min-height: 100vh;
          background: var(--bg);
          font-family:
            'Pretendard',
            'Noto Sans KR',
            system-ui,
            -apple-system,
            sans-serif;
          color: var(--text);
          padding: 20px;
          padding-bottom: 100px;
        }

        .site-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding: 0 4px;
        }

        .site-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .search-toggle {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 8px 12px;
          color: var(--text);
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .search-toggle:hover {
          background: var(--hover);
        }

        .search-section {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .search-input {
          width: 100%;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 16px;
          color: var(--text);
          margin-bottom: 16px;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .site-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .site-item {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .site-item:hover {
          background: var(--hover);
          border-color: #3b82f6;
        }

        .site-item.selected {
          background: var(--accent);
          border-color: #3b82f6;
        }

        .site-item-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }

        .site-item-manager {
          font-size: 14px;
          color: var(--muted);
        }

        .site-info-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .site-info-header {
          display: flex;
          align-items: center;
          justify-content: between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }

        .site-info-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .site-info-grid {
          display: grid;
          gap: 16px;
        }

        .info-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--muted);
          min-width: 80px;
          flex-shrink: 0;
        }

        .info-value {
          font-size: 15px;
          color: var(--text);
          text-align: right;
          flex: 1;
          min-height: 20px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .info-value:hover {
          background: var(--hover);
        }

        .info-value.expandable {
          cursor: pointer;
        }

        .info-value.expandable.expanded {
          white-space: normal;
          word-break: break-all;
          max-width: none;
          background: var(--accent);
        }

        .action-btn {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #2563eb;
        }

        .action-btn.secondary {
          background: var(--muted);
          color: var(--text);
        }

        .action-btn.secondary:hover {
          background: var(--border);
        }

        .npc-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .npc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }

        .npc-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .npc-title-icon {
          width: 24px;
          height: 24px;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>')
            no-repeat center;
          background-size: contain;
        }

        .npc-kpi {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .npc-kpi-item {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .npc-kpi-label {
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 4px;
        }

        .npc-kpi-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
        }

        .npc-kpi-value.positive {
          color: #10b981;
        }

        .npc-kpi-value.negative {
          color: #ef4444;
        }

        .npc-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .npc-btn {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .npc-btn:hover {
          background: var(--hover);
          border-color: #3b82f6;
        }

        .npc-btn.add {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .npc-btn.add:hover {
          background: #2563eb;
        }

        .modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: var(--card);
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: var(--hover);
          color: var(--text);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 6px;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          color: var(--text);
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .btn-secondary:hover {
          background: var(--hover);
        }

        .attachment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .attachment-item {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .attachment-item:hover {
          background: var(--hover);
          border-color: #3b82f6;
        }

        .attachment-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
          word-break: break-all;
        }

        .attachment-meta {
          font-size: 12px;
          color: var(--muted);
          display: flex;
          justify-content: space-between;
        }

        .npc-add-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          z-index: 100;
          min-width: 180px;
          margin-top: 4px;
        }

        .npc-add-menu-option {
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          color: var(--text);
          border-bottom: 1px solid var(--border);
        }

        .npc-add-menu-option:last-child {
          border-bottom: none;
        }

        .npc-add-menu-option:hover {
          background: var(--hover);
        }

        .npc-add-menu-option:first-child {
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
        }

        .npc-add-menu-option:last-child {
          border-bottom-left-radius: 12px;
          border-bottom-right-radius: 12px;
        }

        .npc-log-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }

        .npc-log-table th,
        .npc-log-table td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
        }

        .npc-log-table th {
          background: var(--bg);
          font-weight: 600;
          color: var(--muted);
        }

        .npc-log-table td {
          color: var(--text);
        }

        .npc-chip {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid;
        }

        .npc-chip.text-tag2 {
          background: #ecfdf5;
          color: #10b981;
          border-color: #10b981;
        }

        .npc-chip.text-red-500 {
          background: #fef2f2;
          color: #ef4444;
          border-color: #ef4444;
        }

        .text-right {
          text-align: right;
        }

        .font-bold {
          font-weight: 700;
        }

        .py-6 {
          padding-top: 24px;
          padding-bottom: 24px;
        }

        .text-center {
          text-align: center;
        }

        @media (max-width: 768px) {
          .site-container {
            padding: 16px;
          }

          .npc-kpi {
            grid-template-columns: 1fr;
          }

          .npc-actions {
            grid-template-columns: 1fr;
          }

          .attachment-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <div className="site-header">
        <h1 className="site-title">현장정보</h1>
        <button className="search-toggle" onClick={() => setIsSearchMode(!isSearchMode)}>
          <Search size={16} />
          {isSearchMode ? '닫기' : '현장검색'}
        </button>
      </div>

      {/* Search Section */}
      {isSearchMode && (
        <div className="search-section">
          <input
            type="text"
            className="search-input"
            placeholder="현장명 또는 관리자 이름으로 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div className="site-list">
            {filteredSites.map(site => (
              <div
                key={site.id}
                className={`site-item ${selectedSite?.id === site.id ? 'selected' : ''}`}
                onClick={() => handleSiteSelect(site)}
              >
                <div className="site-item-name">{site.name}</div>
                <div className="site-item-manager">관리자: {site.manager}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Site Info */}
      {selectedSite && (
        <div className="site-info-card">
          <div className="site-info-header">
            <h2 className="site-info-title">{selectedSite.name}</h2>
          </div>
          <div className="site-info-grid">
            <div className="info-row">
              <span className="info-label">관리자</span>
              <span className="info-value">{selectedSite.manager}</span>
            </div>
            <div className="info-row">
              <span className="info-label">연락처1</span>
              <span className="info-value">
                {selectedSite.phone1}
                <button className="action-btn" onClick={() => handlePhoneCall(selectedSite.phone1)}>
                  전화
                </button>
              </span>
            </div>
            {selectedSite.phone2 && (
              <div className="info-row">
                <span className="info-label">연락처2</span>
                <span className="info-value">
                  {selectedSite.phone2}
                  <button
                    className="action-btn"
                    onClick={() => handlePhoneCall(selectedSite.phone2)}
                  >
                    전화
                  </button>
                </span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">주소</span>
              <span
                className={`info-value expandable ${expandedField === 'address' ? 'expanded' : ''}`}
                onClick={() => setExpandedField(expandedField === 'address' ? null : 'address')}
              >
                {selectedSite.address}
                <button
                  className="action-btn secondary"
                  onClick={e => {
                    e.stopPropagation()
                    handleCopyText(selectedSite.address)
                  }}
                >
                  복사
                </button>
                <button
                  className="action-btn"
                  onClick={e => {
                    e.stopPropagation()
                    handleOpenTmap(selectedSite.address)
                  }}
                >
                  T맵
                </button>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">숙소</span>
              <span
                className={`info-value expandable ${expandedField === 'lodging' ? 'expanded' : ''}`}
                onClick={() => setExpandedField(expandedField === 'lodging' ? null : 'lodging')}
              >
                {selectedSite.lodging}
                <button
                  className="action-btn secondary"
                  onClick={e => {
                    e.stopPropagation()
                    handleCopyText(selectedSite.lodging)
                  }}
                >
                  복사
                </button>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* NPC-1000 Material Management */}
      <div className="npc-card">
        <div className="npc-header">
          <h3 className="npc-title">
            <span className="npc-title-icon"></span>
            NPC-1000 자재관리
          </h3>
        </div>

        <div className="npc-kpi">
          <div className="npc-kpi-item">
            <div className="npc-kpi-label">오늘 입고</div>
            <div className="npc-kpi-value positive">{formatNumber(npcKPI.inQty)}</div>
          </div>
          <div className="npc-kpi-item">
            <div className="npc-kpi-label">오늘 사용</div>
            <div className="npc-kpi-value negative">
              {npcKPI.used > 0 ? `-${formatNumber(npcKPI.used)}` : '0'}
            </div>
          </div>
          <div className="npc-kpi-item">
            <div className="npc-kpi-label">현재 재고</div>
            <div className="npc-kpi-value">{formatNumber(npcKPI.currentStock)}</div>
          </div>
        </div>

        <div className="npc-actions">
          <button className="npc-btn" onClick={() => setShowNpcLogModal(true)}>
            오늘 로그
          </button>
          <button className="npc-btn" onClick={handleNpcRecord}>
            기록 입력
          </button>
          <button className="npc-btn" onClick={handleNpcRequest}>
            자재 요청
          </button>
          <div style={{ position: 'relative' }}>
            <button className="npc-btn add" onClick={() => setShowNpcAddMenu(!showNpcAddMenu)}>
              <Plus size={16} />
              추가
            </button>
            {showNpcAddMenu && (
              <div className="npc-add-menu">
                <div
                  className="npc-add-menu-option"
                  onClick={() => {
                    setShowNpcAddMenu(false)
                    setNpcFormData({
                      site: '',
                      date: formatDate(new Date()),
                      type: 'in',
                      qty: 1,
                      memo: '',
                    })
                    setShowNpcRecordModal(true)
                  }}
                >
                  입고 기록
                </div>
                <div
                  className="npc-add-menu-option"
                  onClick={() => {
                    setShowNpcAddMenu(false)
                    setNpcRequestData({
                      site: '',
                      qty: 1,
                      memo: '',
                    })
                    setShowNpcRequestModal(true)
                  }}
                >
                  자재 요청
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attachment Popup */}
      {showAttachmentPopup && selectedSite && (
        <div className="modal" onClick={() => setShowAttachmentPopup(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{selectedSite.name} 첨부파일</h3>
              <button className="close-btn" onClick={() => setShowAttachmentPopup(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="attachment-grid">
              {sampleAttachments.map((file, index) => (
                <div
                  key={index}
                  className="attachment-item"
                  onClick={() => handleFilePreview(file)}
                >
                  <div className="attachment-name">{file.name}</div>
                  <div className="attachment-meta">
                    <span>{file.size}</span>
                    <span>{file.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showPreview && previewFile && (
        <div className="modal" onClick={() => setShowPreview(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{previewFile.name}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="action-btn" onClick={() => handleDownloadFile(previewFile.name)}>
                  <Download size={16} />
                  다운로드
                </button>
                <button className="close-btn" onClick={() => setShowPreview(false)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                background: 'var(--bg)',
                borderRadius: '8px',
              }}
            >
              {previewFile.type === 'pdf' ? (
                <div>PDF 미리보기는 다운로드 후 확인해주세요.</div>
              ) : previewFile.type === 'dwg' ? (
                <div>DWG 파일은 AutoCAD에서 열어주세요.</div>
              ) : (
                <div>이미지 미리보기</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NPC Log Modal */}
      {showNpcLogModal && npcCurrent && (
        <div className="modal" onClick={() => setShowNpcLogModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">오늘의 NPC-1000 로그</h3>
              <button className="close-btn" onClick={() => setShowNpcLogModal(false)}>
                <X size={20} />
              </button>
            </div>
            <table className="npc-log-table">
              <thead>
                <tr>
                  <th>현장</th>
                  <th>날짜</th>
                  <th>구분</th>
                  <th>수량</th>
                  <th>메모</th>
                </tr>
              </thead>
              <tbody>
                {npcCurrent.logs
                  .filter(log => log.date === formatDate(new Date()))
                  .map((log, index) => (
                    <tr key={index}>
                      <td>{npcCurrent.name}</td>
                      <td>{log.date}</td>
                      <td>
                        <span
                          className={`npc-chip ${log.type === 'in' ? 'text-tag2' : 'text-red-500'}`}
                        >
                          {log.type === 'in' ? '입고' : '사용'}
                        </span>
                      </td>
                      <td
                        className={`text-right font-bold ${log.type === 'in' ? 'text-tag2' : 'text-red-500'}`}
                      >
                        {log.type === 'in' ? '+' : '−'}
                        {formatNumber(log.qty)}
                      </td>
                      <td>{log.memo}</td>
                    </tr>
                  ))}
                {npcCurrent.logs.filter(log => log.date === formatDate(new Date())).length ===
                  0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center" style={{ color: 'var(--muted)' }}>
                      기록 없음
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NPC Record Modal */}
      {showNpcRecordModal && (
        <div className="modal" onClick={() => setShowNpcRecordModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">NPC-1000 기록 입력</h3>
              <button className="close-btn" onClick={() => setShowNpcRecordModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">현장</label>
              <select
                className="form-select"
                value={npcFormData.site}
                onChange={e => setNpcFormData(prev => ({ ...prev, site: e.target.value }))}
              >
                {npcSites.map(site => (
                  <option key={site.id} value={site.name}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">날짜</label>
              <input
                type="date"
                className="form-input"
                value={npcFormData.date}
                onChange={e => setNpcFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">구분</label>
              <select
                className="form-select"
                value={npcFormData.type}
                onChange={e =>
                  setNpcFormData(prev => ({ ...prev, type: e.target.value as 'in' | 'out' }))
                }
              >
                <option value="in">입고</option>
                <option value="out">사용</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">수량</label>
              <input
                type="number"
                className="form-input"
                value={npcFormData.qty}
                onChange={e => setNpcFormData(prev => ({ ...prev, qty: Number(e.target.value) }))}
                min="1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">메모</label>
              <textarea
                className="form-textarea"
                value={npcFormData.memo}
                onChange={e => setNpcFormData(prev => ({ ...prev, memo: e.target.value }))}
                placeholder="메모를 입력하세요..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowNpcRecordModal(false)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSaveNpcRecord}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NPC Request Modal */}
      {showNpcRequestModal && (
        <div className="modal" onClick={() => setShowNpcRequestModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">NPC-1000 자재 요청</h3>
              <button className="close-btn" onClick={() => setShowNpcRequestModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="form-group">
              <label className="form-label">현장</label>
              <select
                className="form-select"
                value={npcRequestData.site}
                onChange={e => setNpcRequestData(prev => ({ ...prev, site: e.target.value }))}
              >
                <option value="">현장을 선택하세요</option>
                {npcSites.map(site => (
                  <option key={site.id} value={site.name}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">요청 수량</label>
              <input
                type="number"
                className="form-input"
                value={npcRequestData.qty}
                onChange={e =>
                  setNpcRequestData(prev => ({ ...prev, qty: Number(e.target.value) }))
                }
                min="1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">요청 사유</label>
              <textarea
                className="form-textarea"
                value={npcRequestData.memo}
                onChange={e => setNpcRequestData(prev => ({ ...prev, memo: e.target.value }))}
                placeholder="요청 사유를 입력하세요..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowNpcRequestModal(false)}>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSubmitNpcRequest}>
                요청
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
