'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search,
  X,
  Download,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Plus,
  Paperclip,
} from 'lucide-react'

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
  org?: string
  safety?: string
  managerPhone?: string
  safetyPhone?: string
  drawings?: AttachmentFile[]
  ptw?: AttachmentFile[]
  photos?: AttachmentFile[]
  lastUpdated?: string
}

interface AttachmentFile {
  name: string
  type?: string
  size?: string
  date: string
  url?: string
  category?: 'drawing' | 'ptw' | 'photo'
}

interface AttachmentCategories {
  drawings: AttachmentFile[]
  ptw: AttachmentFile[]
  photos: AttachmentFile[]
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
  // States for single site card (matching HTML requirements)
  const [currentSite, setCurrentSite] = useState<SiteInfo | null>(null)
  const [workDate, setWorkDate] = useState<string>('')
  const [showDetailSection, setShowDetailSection] = useState(false)
  const [showAttachmentPopup, setShowAttachmentPopup] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewFile, setPreviewFile] = useState<AttachmentFile | null>(null)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [fullscreenFile, setFullscreenFile] = useState<AttachmentFile | null>(null)
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState<{
    url: string
    type: string
    name: string
  } | null>(null)
  const [expandedField, setExpandedField] = useState<string | null>(null)
  const [selectedSiteName, setSelectedSiteName] = useState<string | null>(null)
  const [npcCurrent, setNpcCurrent] = useState<NPCSite | null>(null)
  // HTML Dialog refs - replacing React modals
  const npcLogDialogRef = useRef<HTMLDialogElement>(null)
  const npcRecordDialogRef = useRef<HTMLDialogElement>(null)
  const npcRequestDialogRef = useRef<HTMLDialogElement>(null)
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

  // Enhanced attachment categories structure
  const getAttachmentsForSite = (siteName: string): AttachmentCategories => {
    const baseAttachments = {
      drawings: [
        {
          name: 'P3동_기본설계도.dwg',
          date: '2024.03.10',
          size: '2.5MB',
          url: '/files/p3_basic_design.dwg',
        },
        {
          name: '평면도_수정본.pdf',
          date: '2024.03.12',
          size: '1.8MB',
          url: '/files/floor_plan_revised.pdf',
        },
        {
          name: '전기설비도.dwg',
          date: '2024.03.08',
          size: '3.2MB',
          url: '/files/electrical_plan.dwg',
        },
      ],
      ptw: [
        {
          name: 'PTW_240315_타일작업.pdf',
          date: '2024.03.15',
          size: '856KB',
          url: '/files/ptw_tile_work.pdf',
        },
        {
          name: 'PTW_240312_도장작업.pdf',
          date: '2024.03.12',
          size: '742KB',
          url: '/files/ptw_painting.pdf',
        },
      ],
      photos: [
        {
          name: '현장전경_240315.jpg',
          date: '2024.03.15',
          size: '4.2MB',
          url: '/files/site_overview.jpg',
        },
        {
          name: '작업진행_240314.jpg',
          date: '2024.03.14',
          size: '3.8MB',
          url: '/files/work_progress.jpg',
        },
        {
          name: '완료구역_240313.jpg',
          date: '2024.03.13',
          size: '5.1MB',
          url: '/files/completed_area.jpg',
        },
      ],
    }
    return baseAttachments
  }

  // File preview and download handlers
  const handleFilePreview = (file: AttachmentFile) => {
    if (!file.url) return

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension || '')
    const isPDF = fileExtension === 'pdf'

    if (isImage || isPDF) {
      setPreviewContent({
        url: file.url,
        type: isImage ? 'image' : 'pdf',
        name: file.name,
      })
      setShowFullscreenPreview(true)
    } else {
      // For other files, trigger download
      handleFileDownload(file)
    }
  }

  const handleFileDownload = (file: AttachmentFile) => {
    if (file.url) {
      const link = document.createElement('a')
      link.href = file.url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      alert('파일 URL이 없습니다.')
    }
  }

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
      org: '인옵앤씨',
      safety: '박안전',
      managerPhone: '010-1234-5678',
      safetyPhone: '010-8765-4321',
      drawings: [
        {
          name: '현장배치도.pdf',
          type: 'pdf',
          size: '2.5MB',
          date: '2025-01-15',
          category: 'drawing',
        },
        {
          name: '구조도면.dwg',
          type: 'dwg',
          size: '5.2MB',
          date: '2025-01-14',
          category: 'drawing',
        },
      ],
      ptw: [
        { name: 'PTW-001.pdf', type: 'pdf', size: '1.2MB', date: '2025-01-15', category: 'ptw' },
        { name: 'PTW-002.pdf', type: 'pdf', size: '980KB', date: '2025-01-14', category: 'ptw' },
      ],
      photos: [
        {
          name: '현장사진_전경.jpg',
          type: 'jpg',
          size: '850KB',
          date: '2025-01-15',
          category: 'other',
        },
        { name: '작업현황.jpg', type: 'jpg', size: '1.1MB', date: '2025-01-15', category: 'other' },
      ],
      lastUpdated: '2025-01-15',
    },
    {
      id: '2',
      name: 'LG디스플레이 파주공장',
      manager: '이관리',
      phone1: '010-2345-6789',
      address: '경기도 파주시 산업로 123',
      lodging: '파주 게스트하우스 (031-987-6543)',
      lastUpdate: '2025-01-14',
      org: '인옵앤씨',
      safety: '김안전',
      managerPhone: '010-2345-6789',
      safetyPhone: '010-9876-5432',
      drawings: [
        {
          name: 'LG공장_배치도.pdf',
          type: 'pdf',
          size: '3.2MB',
          date: '2025-01-14',
          category: 'drawing',
        },
      ],
      ptw: [],
      photos: [
        {
          name: '파주공장_현장사진.jpg',
          type: 'jpg',
          size: '1.2MB',
          date: '2025-01-14',
          category: 'other',
        },
      ],
      lastUpdated: '2025-01-14',
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
    const storedDate = localStorage.getItem('state_date')
    const storedWorkLogData = localStorage.getItem('workLogData')

    if (storedSiteName) {
      const site = sampleSites.find(s => s.name === storedSiteName)
      if (site) {
        // Update site data from workLogData if available
        let updatedSite = { ...site }
        if (storedWorkLogData) {
          try {
            const workLogData = JSON.parse(storedWorkLogData)
            // Merge workLogData into site info if applicable
            if (Array.isArray(workLogData)) {
              const siteWorkLog = workLogData.find((log: any) => log.siteName === storedSiteName)
              if (siteWorkLog) {
                updatedSite = {
                  ...updatedSite,
                  lastUpdated: formatDate(new Date()),
                  // Update photos count from work log data
                  photosBefore: siteWorkLog.photosBefore || updatedSite.photosBefore,
                  photosAfter: siteWorkLog.photosAfter || updatedSite.photosAfter,
                }
              }
            }
          } catch (e) {
            console.warn('Failed to parse workLogData from localStorage:', e)
          }
        }

        setCurrentSite(updatedSite)
        setSelectedSiteName(storedSiteName)
        updateNpcForSite(storedSiteName)
      }
    }

    // Set work date from localStorage or current date
    setWorkDate(storedDate || new Date().toISOString().slice(0, 10))
  }, [])

  // Real-time localStorage synchronization (matching HTML behavior)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'state_site' && e.newValue) {
        const site = sampleSites.find(s => s.name === e.newValue)
        if (site) {
          // Update site data from workLogData if available
          let updatedSite = { ...site }
          const storedWorkLogData = localStorage.getItem('workLogData')
          if (storedWorkLogData) {
            try {
              const workLogData = JSON.parse(storedWorkLogData)
              if (Array.isArray(workLogData)) {
                const siteWorkLog = workLogData.find((log: any) => log.siteName === e.newValue)
                if (siteWorkLog) {
                  updatedSite = {
                    ...updatedSite,
                    lastUpdated: formatDate(new Date()),
                    photosBefore: siteWorkLog.photosBefore || updatedSite.photosBefore,
                    photosAfter: siteWorkLog.photosAfter || updatedSite.photosAfter,
                  }
                }
              }
            } catch (error) {
              console.warn('Failed to parse workLogData during storage sync:', error)
            }
          }

          setCurrentSite(updatedSite)
          setSelectedSiteName(e.newValue)
          updateNpcForSite(e.newValue)
        }
      }

      if (e.key === 'state_date' && e.newValue) {
        setWorkDate(e.newValue)
      }

      // Handle workLogData changes for real-time sync
      if (e.key === 'workLogData' && e.newValue && currentSite) {
        try {
          const workLogData = JSON.parse(e.newValue)
          if (Array.isArray(workLogData)) {
            const siteWorkLog = workLogData.find((log: any) => log.siteName === currentSite.name)
            if (siteWorkLog) {
              setCurrentSite(prev =>
                prev
                  ? {
                      ...prev,
                      lastUpdated: formatDate(new Date()),
                      photosBefore: siteWorkLog.photosBefore || prev.photosBefore,
                      photosAfter: siteWorkLog.photosAfter || prev.photosAfter,
                    }
                  : prev
              )
            }
          }
        } catch (error) {
          console.warn('Failed to parse workLogData during real-time sync:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [currentSite])

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

  // Helper function to sync changes to workLogData
  const syncToWorkLogData = useCallback(
    (updates: Partial<{ photosBefore: number; photosAfter: number; lastUpdated: string }>) => {
      if (!currentSite) return

      try {
        const storedWorkLogData = localStorage.getItem('workLogData')
        let workLogData = []

        if (storedWorkLogData) {
          workLogData = JSON.parse(storedWorkLogData)
          if (!Array.isArray(workLogData)) {
            workLogData = []
          }
        }

        const existingIndex = workLogData.findIndex((log: any) => log.siteName === currentSite.name)
        const updatedEntry = {
          siteName: currentSite.name,
          workDate: workDate,
          photosBefore: updates.photosBefore ?? currentSite.photosBefore ?? 0,
          photosAfter: updates.photosAfter ?? currentSite.photosAfter ?? 0,
          lastUpdated: updates.lastUpdated ?? formatDate(new Date()),
        }

        if (existingIndex >= 0) {
          workLogData[existingIndex] = { ...workLogData[existingIndex], ...updatedEntry }
        } else {
          workLogData.push(updatedEntry)
        }

        localStorage.setItem('workLogData', JSON.stringify(workLogData))

        // Update current site state with new data
        setCurrentSite(prev => (prev ? { ...prev, ...updates } : prev))
      } catch (error) {
        console.warn('Failed to sync data to workLogData:', error)
      }
    },
    [currentSite, workDate]
  )

  // Event handlers
  const toggleDetailSection = () => {
    setShowDetailSection(!showDetailSection)
  }

  const handleSiteSelect = (site: SiteInfo) => {
    setCurrentSite(site)
    setSelectedSiteName(site.name)
    updateNpcForSite(site.name)

    // Store in localStorage like HTML version
    localStorage.setItem('state_site', site.name)
    localStorage.setItem('inopnc_author', site.manager)
    localStorage.setItem('orgName', site.name)
    localStorage.setItem('address', site.address)
    localStorage.setItem('lodging', site.lodging)

    // Update workLogData to reflect current site selection
    try {
      const storedWorkLogData = localStorage.getItem('workLogData')
      if (storedWorkLogData) {
        const workLogData = JSON.parse(storedWorkLogData)
        if (Array.isArray(workLogData)) {
          // Update or create entry for selected site
          const existingIndex = workLogData.findIndex((log: any) => log.siteName === site.name)
          const siteEntry = {
            siteName: site.name,
            workDate: localStorage.getItem('state_date') || new Date().toISOString().slice(0, 10),
            photosBefore: site.photosBefore || 0,
            photosAfter: site.photosAfter || 0,
            lastUpdated: formatDate(new Date()),
          }

          if (existingIndex >= 0) {
            workLogData[existingIndex] = { ...workLogData[existingIndex], ...siteEntry }
          } else {
            workLogData.push(siteEntry)
          }

          localStorage.setItem('workLogData', JSON.stringify(workLogData))
        }
      }
    } catch (error) {
      console.warn('Failed to update workLogData during site selection:', error)
    }
  }

  // Enhanced phone call handler with haptic feedback
  const handlePhoneCall = (phoneNumber: string) => {
    if (phoneNumber && phoneNumber !== '-') {
      // Add haptic feedback for mobile devices
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
      window.location.href = `tel:${phoneNumber}`
    } else {
      alert('전화번호가 없습니다.')
    }
  }

  // Enhanced copy text handler with better feedback and fallback
  const handleCopyText = async (text: string) => {
    if (!text || text === '-') {
      alert('복사할 내용이 없습니다.')
      return
    }

    try {
      // Add haptic feedback for mobile devices
      if (navigator.vibrate) {
        navigator.vibrate([30, 10, 30])
      }

      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        alert('복사되었습니다.')
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          document.execCommand('copy')
          alert('복사되었습니다.')
        } catch (err) {
          console.error('Fallback copy failed:', err)
          alert('복사 실패: 권한을 확인하세요.')
        }

        document.body.removeChild(textArea)
      }
    } catch (e) {
      console.error('Copy failed:', e)
      alert('복사 실패: 권한을 확인하세요.')
    }
  }

  // Enhanced ripple effect function (matches HTML requirements)
  const addRippleEffect = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2

    const ripple = document.createElement('span')
    ripple.style.position = 'absolute'
    ripple.style.borderRadius = '50%'
    ripple.style.background = 'rgba(255, 255, 255, 0.35)'
    ripple.style.transform = 'scale(0)'
    ripple.style.animation = 'ripple 0.45s ease-out'
    ripple.style.pointerEvents = 'none'
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = x + 'px'
    ripple.style.top = y + 'px'
    ripple.classList.add('ripple-ink')

    // Ensure button has relative positioning
    if (button.style.position !== 'relative') {
      button.style.position = 'relative'
    }
    button.style.overflow = 'hidden'

    button.appendChild(ripple)

    // Remove ripple after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.remove()
      }
    }, 450)
  }

  // Enhanced T-map navigation handler with improved UX
  const handleOpenTmap = (address: string) => {
    if (!address || address === '-') {
      alert('주소 정보가 없습니다.')
      return
    }

    // Add haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate(100)
    }

    const tmapScheme = `tmap://search?name=${encodeURIComponent(address)}`
    const tmapWebUrl = `https://tmapapi.sktelecom.com/main/map.html?q=${encodeURIComponent(address)}`
    const kakaoMapUrl = `https://map.kakao.com/?q=${encodeURIComponent(address)}`
    const naverMapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(address)}`

    try {
      // Create invisible link for T-map app scheme
      const link = document.createElement('a')
      link.href = tmapScheme
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Enhanced fallback with multiple map options
      setTimeout(() => {
        const mapChoice = confirm(
          `T맵 앱이 설치되어 있지 않습니다.\n\n주소: ${address}\n\n"확인"을 누르면 T맵 웹으로 이동합니다.\n"취소"를 누르면 다른 지도 앱을 선택할 수 있습니다.`
        )

        if (mapChoice) {
          // Open T-map web version
          window.open(tmapWebUrl, '_blank')
        } else {
          // Show additional map options
          const alternativeChoice = confirm(
            '다른 지도 서비스를 선택하세요.\n\n"확인" - 카카오맵\n"취소" - 네이버지도'
          )

          if (alternativeChoice) {
            window.open(kakaoMapUrl, '_blank')
          } else {
            window.open(naverMapUrl, '_blank')
          }
        }
      }, 1200) // Slightly longer timeout for better UX
    } catch (error) {
      console.error('T맵 연결 오류:', error)
      // Fallback to Kakao Map on error
      window.open(kakaoMapUrl, '_blank')
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

  const handleFullscreenPreview = (file: AttachmentFile) => {
    setFullscreenFile(file)
    setShowFullscreen(true)
  }

  // NPC event handlers - Enhanced to match HTML requirements
  const handleNpcRecord = () => {
    if (!selectedSiteName) {
      alert('현장을 먼저 선택해주세요.')
      return
    }
    // Auto-set current site and today's date
    setNpcFormData({
      site: selectedSiteName,
      date: formatDate(new Date()),
      type: 'in',
      qty: 1,
      memo: '',
    })
    npcRecordDialogRef.current?.showModal()
  }

  const handleNpcLog = () => {
    if (!npcCurrent) {
      alert('현장 데이터가 없습니다.')
      return
    }
    npcLogDialogRef.current?.showModal()
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
    npcRequestDialogRef.current?.showModal()
  }

  const handleNpcNewTag = () => {
    setShowNpcAddMenu(true)
  }

  const handleSaveNpcRecord = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

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

    npcRecordDialogRef.current?.close()
    alert('기록이 저장되었습니다.')
  }

  const handleSubmitNpcRequest = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

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
    npcRequestDialogRef.current?.close()
    alert('자재 요청이 제출되었습니다.')
  }

  // Initialize with first site if no site is selected
  useEffect(() => {
    if (!currentSite && sampleSites.length > 0) {
      const firstSite = sampleSites[0]
      setCurrentSite(firstSite)
      setSelectedSiteName(firstSite.name)
      updateNpcForSite(firstSite.name)

      // Store in localStorage
      localStorage.setItem('state_site', firstSite.name)
      localStorage.setItem('inopnc_author', firstSite.manager)
    }
  }, [currentSite])

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

        .site-actions {
          display: flex;
          gap: 8px;
        }

        .btn-attachment,
        .btn-detail {
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

        .btn-attachment:hover,
        .btn-detail:hover {
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

        .card-header {
          display: grid;
          grid-template-columns: 40px 1fr auto;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }

        .site-icon {
          width: 32px;
          height: 32px;
          background: #3b82f6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
        }

        .site-name {
          font-size: 17px;
          font-weight: 700;
          color: #1a254f;
          margin: 0;
          line-height: 1.4;
        }

        /* HTML requirements: Font size classes (matching .q class) */
        .q {
          font-family: 'Noto Sans KR', system-ui, sans-serif;
          font-weight: 700;
          font-size: 17px;
          line-height: 1.4;
          color: #1a254f;
        }

        /* Font size support - basic (fs-100) */
        body.fs-100 .site-name {
          font-size: 17px;
        }

        /* Font size support - large (fs-150) */
        body.fs-150 .site-name {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          word-break: keep-all;
        }

        body.fs-150 .info-label {
          font-size: 1.1rem;
        }

        body.fs-150 .info-value {
          font-size: 1.2rem;
        }

        body.fs-150 .btn-detail,
        body.fs-150 .btn-attachment,
        body.fs-150 .action-btn {
          font-size: 1.1rem;
          padding: 12px 16px;
        }

        .work-date {
          font-size: 14px;
          color: var(--muted);
          background: var(--bg);
          padding: 4px 8px;
          border-radius: 6px;
        }

        .site-info-grid {
          display: grid;
          gap: 16px;
        }

        .info-row {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          align-items: center;
          gap: 12px;
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
        }

        .info-actions {
          display: flex;
          gap: 6px;
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
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .action-btn.secondary:hover {
          background: var(--hover);
        }

        /* HTML requirements: Ripple effects */
        .ripple {
          position: relative;
          overflow: hidden;
        }

        .ripple-ink {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.35);
          transform: scale(0);
          animation: ripple 0.45s ease-out;
          pointer-events: none;
        }

        @keyframes ripple {
          to {
            transform: scale(2);
            opacity: 0;
          }
        }

        /* Enhanced button styling for HTML compliance */
        .btn-detail {
          position: relative;
          background: rgba(41, 52, 208, 0.1);
          color: #2934d0;
          border: 1px solid rgba(41, 52, 208, 0.2);
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .btn-detail:hover {
          background: rgba(41, 52, 208, 0.15);
          border-color: rgba(41, 52, 208, 0.3);
        }

        .btn-attachment {
          position: relative;
          background: var(--card);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .btn-attachment:hover {
          background: var(--hover);
          border-color: #3b82f6;
        }

        /* HTML requirements: Dark mode support */
        [data-theme='dark'] .site-info-card .site-name {
          color: #e9eef5;
        }

        [data-theme='dark'] .site-info-card .btn-detail {
          background-color: rgba(41, 52, 208, 0.3);
          color: #5b6bff;
          border-color: rgba(91, 107, 255, 0.3);
        }

        [data-theme='dark'] .site-info-card .btn-detail:hover {
          background-color: rgba(41, 52, 208, 0.5);
          border-color: #5b6bff;
        }

        [data-theme='dark'] .site-info-card .btn-attachment {
          background-color: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border-color: rgba(96, 165, 250, 0.3);
        }

        [data-theme='dark'] .site-info-card .btn-attachment:hover {
          background-color: rgba(59, 130, 246, 0.25);
          border-color: #60a5fa;
        }

        [data-theme='dark'] .info-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        [data-theme='dark'] .info-label {
          color: #9ca3af;
        }

        [data-theme='dark'] .info-value {
          color: #e9eef5;
        }

        [data-theme='dark'] .npc-card {
          background: rgba(0, 0, 0, 0.2);
          border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme='dark'] .npc-current-stock {
          color: #10b981;
        }

        /* HTML requirements: Responsive breakpoints */
        @media (max-width: 768px) {
          .site-info-card {
            padding: 16px;
          }

          .site-name {
            font-size: 16px;
            max-width: 250px;
          }

          .info-row {
            grid-template-columns: 70px 1fr auto;
            gap: 8px;
          }

          .info-label {
            font-size: 12px;
          }

          .btn-detail,
          .btn-attachment {
            padding: 6px 12px;
            font-size: 12px;
          }

          .npc-card {
            padding: 12px;
          }
        }

        @media (max-width: 480px) {
          .site-info-card {
            padding: 12px;
            margin: 8px;
          }

          .site-name {
            font-size: 15px;
            max-width: 200px;
          }

          .info-row {
            grid-template-columns: 60px 1fr auto;
            gap: 6px;
          }

          .info-label {
            font-size: 11px;
          }

          .info-value {
            font-size: 13px;
            max-width: 150px;
          }

          .btn-detail,
          .btn-attachment {
            padding: 4px 8px;
            font-size: 11px;
          }

          .npc-card {
            padding: 10px;
          }
        }

        /* HTML requirements: Font size responsive adjustments */
        body.fs-150 .site-info-card .info-label {
          font-size: 14px;
        }

        body.fs-150 .site-info-card .info-value {
          font-size: 16px;
        }

        body.fs-150 .btn-detail,
        body.fs-150 .btn-attachment {
          font-size: 15px;
          padding: 10px 18px;
        }

        @media (max-width: 768px) {
          body.fs-150 .site-name {
            font-size: 1.1rem;
          }

          body.fs-150 .info-label {
            font-size: 13px;
          }

          body.fs-150 .info-value {
            font-size: 15px;
          }
        }

        .toggle-section {
          display: flex;
          justify-content: center;
          margin: 16px 0;
        }

        .detail-section {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .detail-section.show {
          max-height: 1000px;
          opacity: 1;
        }

        .info-value {
          font-size: 15px;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .info-value.expandable {
          cursor: pointer;
          position: relative;
        }

        .info-value.expandable:hover {
          background: var(--hover);
        }

        .info-value.expandable.expanded {
          max-width: none;
          white-space: normal;
          word-break: break-all;
          background: var(--accent);
          border: 1px solid #3b82f6;
        }

        .info-actions {
          display: flex;
          gap: 4px;
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

        /* Attachment Popup Styles */
        .attachment-popup {
          max-width: 700px;
          max-height: 80vh;
        }

        .attachment-category {
          margin-bottom: 24px;
        }

        .attachment-category:last-child {
          margin-bottom: 0;
        }

        .attachment-category-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }

        .attachment-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .attachment-item {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.2s;
        }

        .attachment-item:hover {
          background: var(--hover);
          border-color: #3b82f6;
        }

        .attachment-info {
          flex: 1;
        }

        .attachment-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 2px;
        }

        .attachment-meta {
          font-size: 12px;
          color: var(--muted);
          display: flex;
          gap: 12px;
        }

        .attachment-actions {
          display: flex;
          gap: 6px;
        }

        .no-files {
          padding: 24px;
          text-align: center;
          color: var(--muted);
          background: var(--bg);
          border: 1px dashed var(--border);
          border-radius: 8px;
          font-size: 14px;
        }

        /* Font size support (fs-150) */
        body.fs-150 .site-name {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          word-break: keep-all;
        }

        body.fs-150 .info-label,
        body.fs-150 .info-value {
          font-size: 1rem;
        }

        body.fs-150 .action-btn {
          padding: 6px 12px;
          font-size: 0.875rem;
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

        /* NPC Dialog Styles - HTML dialog elements */
        .npc-dialog {
          margin: auto;
          padding: 0;
          border: none;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          background: transparent;
          max-width: 500px;
          width: 90vw;
          max-height: 80vh;
          overflow: visible;
        }

        .npc-dialog::backdrop {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .npc-dialog-content {
          background: var(--card);
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .npc-dialog-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }

        .npc-dialog-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .npc-dialog-close {
          background: none;
          border: none;
          font-size: 20px;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .npc-dialog-close:hover {
          background: var(--hover);
          color: var(--text);
        }

        .npc-dialog-body {
          flex: 1;
          overflow-y: auto;
        }

        .npc-dialog-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
        }

        .npc-form-group {
          margin-bottom: 16px;
        }

        .npc-form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 6px;
        }

        .npc-form-input,
        .npc-form-select,
        .npc-form-textarea {
          width: 100%;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          color: var(--text);
          box-sizing: border-box;
          font-family: inherit;
        }

        .npc-form-input:focus,
        .npc-form-select:focus,
        .npc-form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .npc-form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .npc-btn-primary {
          background: #3b82f6;
          color: white;
          border: none;
        }

        .npc-btn-primary:hover {
          background: #2563eb;
        }

        .npc-btn-secondary {
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
        }

        .npc-btn-secondary:hover {
          background: var(--hover);
        }

        /* NPC Action button styles */
        .npc-tag-btn {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .npc-tag-btn:hover {
          background: #2563eb;
        }

        /* Font size support for dialogs */
        body.fs-150 .npc-dialog-title {
          font-size: 1.25rem;
        }

        body.fs-150 .npc-form-label {
          font-size: 1rem;
        }

        body.fs-150 .npc-form-input,
        body.fs-150 .npc-form-select,
        body.fs-150 .npc-form-textarea {
          font-size: 1rem;
          padding: 12px 14px;
        }

        body.fs-150 .npc-btn {
          padding: 12px 18px;
          font-size: 1rem;
        }

        /* Mobile responsiveness for dialogs */
        @media (max-width: 768px) {
          .npc-dialog {
            width: 95vw;
            max-width: none;
          }

          .npc-dialog-content {
            padding: 20px;
          }

          .npc-dialog-actions {
            flex-direction: column-reverse;
          }

          .npc-dialog-actions .npc-btn {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .npc-dialog {
            width: 98vw;
            max-height: 90vh;
          }

          .npc-dialog-content {
            padding: 16px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="site-header">
        <h1 className="site-title">현장정보</h1>
        <div className="site-actions">
          <button className="btn-attachment" onClick={() => setShowAttachmentPopup(true)}>
            <Paperclip size={16} />
            첨부파일
          </button>
          <button className="btn-detail" onClick={() => setShowDetailSection(!showDetailSection)}>
            {showDetailSection ? '간단' : '상세'}
          </button>
        </div>
      </div>

      {/* Single Site Info Card - Matches HTML Requirements */}
      {currentSite && (
        <div className="site-info-card">
          {/* Card Header: 현장명 + 아이콘 + 작업일자 - Matches HTML */}
          <div className="card-header">
            <div className="site-icon">{currentSite.name.charAt(0)}</div>
            <h2 className="site-name q">{currentSite.name}</h2>
            <div className="header-actions">
              <div className="work-date">{workDate}</div>
              <button
                className={`btn-detail ${showDetailSection ? 'active' : ''}`}
                onClick={() => setShowDetailSection(!showDetailSection)}
              >
                {showDetailSection ? '간단' : '상세'}
              </button>
            </div>
          </div>

          {/* Basic Information Grid */}
          <div className="site-info-grid">
            <div className="info-row">
              <span className="info-label">소속</span>
              <span className="info-value">{currentSite.org || '인옵앤씨'}</span>
              <div className="info-actions">{/* Empty for now */}</div>
            </div>
            <div className="info-row">
              <span className="info-label">관리자</span>
              <span className="info-value">{currentSite.manager}</span>
              <div className="info-actions">
                <button
                  className="action-btn"
                  onClick={e => {
                    addRippleEffect(e)
                    handlePhoneCall(currentSite.managerPhone || currentSite.phone1)
                  }}
                  data-tel={currentSite.managerPhone || currentSite.phone1}
                >
                  통화
                </button>
              </div>
            </div>
            <div className="info-row">
              <span className="info-label">안전담당자</span>
              <span className="info-value">{currentSite.safety || currentSite.manager}</span>
              <div className="info-actions">
                <button
                  className="action-btn"
                  onClick={e => {
                    addRippleEffect(e)
                    handlePhoneCall(
                      currentSite.safetyPhone || currentSite.phone2 || currentSite.phone1
                    )
                  }}
                  data-tel={currentSite.safetyPhone || currentSite.phone2 || currentSite.phone1}
                >
                  통화
                </button>
              </div>
            </div>
            <div className="info-row">
              <span className="info-label">주소</span>
              <span
                className={`info-value expandable ${expandedField === 'address' ? 'expanded' : ''}`}
                onClick={() => setExpandedField(expandedField === 'address' ? null : 'address')}
              >
                {currentSite.address}
              </span>
              <div className="info-actions">
                <button
                  className="action-btn secondary"
                  onClick={e => {
                    e.stopPropagation()
                    addRippleEffect(e)
                    handleCopyText(currentSite.address)
                  }}
                  data-copy={currentSite.address}
                >
                  복사
                </button>
                <button
                  className="action-btn"
                  onClick={e => {
                    e.stopPropagation()
                    addRippleEffect(e)
                    handleOpenTmap(currentSite.address)
                  }}
                  data-tmap={currentSite.address}
                >
                  T맵
                </button>
              </div>
            </div>
            <div className="info-row">
              <span className="info-label">숙소</span>
              <span
                className={`info-value expandable ${expandedField === 'lodging' ? 'expanded' : ''}`}
                onClick={() => setExpandedField(expandedField === 'lodging' ? null : 'lodging')}
              >
                {currentSite.lodging}
              </span>
              <div className="info-actions">
                <button
                  className="action-btn secondary"
                  onClick={e => {
                    e.stopPropagation()
                    addRippleEffect(e)
                    handleCopyText(currentSite.lodging)
                  }}
                  data-copy={currentSite.lodging}
                >
                  복사
                </button>
                <button
                  className="action-btn"
                  onClick={e => {
                    e.stopPropagation()
                    addRippleEffect(e)
                    handleOpenTmap(currentSite.lodging)
                  }}
                  data-tmap={currentSite.lodging}
                >
                  T맵
                </button>
              </div>
            </div>

            {/* Attachment Info Row - Matches HTML Requirements */}
            <div className="info-row">
              <span className="info-label">첫부파일</span>
              <span className="info-value">3개 카테고리</span>
              <div className="info-actions">
                <button
                  className="action-btn"
                  onClick={e => {
                    addRippleEffect(e)
                    setShowAttachmentPopup(true)
                  }}
                >
                  보기
                </button>
              </div>
            </div>
          </div>

          {/* Toggle Button - Matches HTML Requirements */}
          <div className="toggle-section">
            <button
              className={`btn-detail ${showDetailSection ? 'active' : ''}`}
              onClick={e => {
                addRippleEffect(e)
                setShowDetailSection(!showDetailSection)
              }}
            >
              {showDetailSection ? '간단' : '상세'}
            </button>
          </div>

          {/* Detail Section - Toggleable */}
          {showDetailSection && (
            <div className="detail-section show">
              <div className="info-row">
                <span className="info-label">부제목</span>
                <span className="info-value">{currentSite.subtitle || '-'}</span>
                <div className="info-actions"></div>
              </div>
              <div className="info-row">
                <span className="info-label">공정</span>
                <span className="info-value">{currentSite.process || '-'}</span>
                <div className="info-actions"></div>
              </div>
              <div className="info-row">
                <span className="info-label">작업종류</span>
                <span className="info-value">{currentSite.workType || '-'}</span>
                <div className="info-actions"></div>
              </div>
              <div className="info-row">
                <span className="info-label">블록</span>
                <span className="info-value">{currentSite.block || '-'}</span>
                <div className="info-actions"></div>
              </div>
              <div className="info-row">
                <span className="info-label">동</span>
                <span className="info-value">{currentSite.building || '-'}</span>
                <div className="info-actions"></div>
              </div>
              <div className="info-row">
                <span className="info-label">호수</span>
                <span className="info-value">{currentSite.unit || '-'}</span>
                <div className="info-actions"></div>
              </div>
              <div className="info-row">
                <span className="info-label">기간</span>
                <span className="info-value">{currentSite.duration || '-'}</span>
                <div className="info-actions"></div>
              </div>
              <div className="info-row">
                <span className="info-label">보수 전 사진</span>
                <span className="info-value">{currentSite.photosBefore || 0}개</span>
                <div className="info-actions"></div>
              </div>
              <div className="info-row">
                <span className="info-label">보수 후 사진</span>
                <span className="info-value">{currentSite.photosAfter || 0}개</span>
                <div className="info-actions"></div>
              </div>
              <div className="info-row">
                <span className="info-label">최근 수정일</span>
                <span className="info-value">{currentSite.lastUpdated || '-'}</span>
                <div className="info-actions"></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Site Selected Message */}
      {!currentSite && (
        <div className="site-info-card">
          <div className="site-info-grid">
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
              홈 페이지에서 현장을 선택해주세요.
            </div>
          </div>
        </div>
      )}

      {/* NPC-1000 Material Management - Matches HTML Requirements */}
      <div className="npc-card">
        <div className="npc-header">
          <div className="npc-title-group">
            <h3 className="npc-title">
              <span className="npc-title-icon">📦</span>
              NPC-1000 재고관리
            </h3>
          </div>
          <div className="npc-actions">
            <button className="npc-tag-btn" onClick={handleNpcNewTag}>
              추가
            </button>
          </div>
        </div>

        {/* KPI Grid - Matching HTML structure */}
        <div className="npc-kpi">
          <div className="npc-kpi-item">
            <p className="npc-kpi-label">입고</p>
            <p className="npc-kpi-value">{npcKPI.inQty}</p>
          </div>
          <div className="npc-kpi-item">
            <p className="npc-kpi-label">사용</p>
            <p className="npc-kpi-value">{npcKPI.used}</p>
          </div>
          <div className="npc-kpi-item">
            <p className="npc-kpi-label">재고</p>
            <p className="npc-kpi-value stock">{npcKPI.currentStock}</p>
          </div>
        </div>

        <div className="npc-buttons">
          <button className="npc-btn npc-btn-ghost" onClick={handleNpcLog}>
            로그 보기
          </button>
          <button className="npc-btn npc-btn-ghost" onClick={handleNpcRequest}>
            자재 요청
          </button>
          <button className="npc-btn npc-btn-primary" onClick={handleNpcRecord}>
            입고 기록
          </button>
        </div>
        {/* Removed old add button - now in header */}
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

      {/* Attachment Popup - Matches HTML Requirements */}
      {showAttachmentPopup && currentSite && (
        <div className="modal" onClick={() => setShowAttachmentPopup(false)}>
          <div className="modal-content attachment-popup" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{currentSite.name} 첨부파일</h3>
              <button className="close-btn" onClick={() => setShowAttachmentPopup(false)}>
                <X size={20} />
              </button>
            </div>

            {/* 현장 공도면 */}
            <div className="attachment-category">
              <h4 className="attachment-category-title">현장 공도면</h4>
              <div className="attachment-list">
                {(currentSite.drawings || []).length > 0 ? (
                  currentSite.drawings.map((file: any, index: number) => (
                    <div key={index} className="attachment-item">
                      <div className="attachment-info">
                        <div className="attachment-name">{file.name}</div>
                        <div className="attachment-meta">
                          <span>{file.date}</span>
                          {file.size && <span>{file.size}</span>}
                        </div>
                      </div>
                      <div className="attachment-actions">
                        <button
                          className="action-btn"
                          onClick={() => handleDownloadFile(file.name)}
                        >
                          <Download size={14} />
                          다운로드
                        </button>
                        <button
                          className="action-btn secondary"
                          onClick={() => handleFilePreview(file)}
                        >
                          미리보기
                        </button>
                        <button
                          className="action-btn fullscreen"
                          onClick={() => handleFullscreenPreview(file)}
                          title="전체화면으로 보기"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-files">등록된 공도면이 없습니다</div>
                )}
              </div>
            </div>

            {/* PTW */}
            <div className="attachment-category">
              <h4 className="attachment-category-title">PTW</h4>
              <div className="attachment-list">
                {(currentSite.ptw || []).length > 0 ? (
                  currentSite.ptw.map((file: any, index: number) => (
                    <div key={index} className="attachment-item">
                      <div className="attachment-info">
                        <div className="attachment-name">{file.name}</div>
                        <div className="attachment-meta">
                          <span>{file.date}</span>
                          {file.size && <span>{file.size}</span>}
                        </div>
                      </div>
                      <div className="attachment-actions">
                        <button
                          className="action-btn"
                          onClick={() => handleDownloadFile(file.name)}
                        >
                          <Download size={14} />
                          다운로드
                        </button>
                        <button
                          className="action-btn secondary"
                          onClick={() => handleFilePreview(file)}
                        >
                          미리보기
                        </button>
                        <button
                          className="action-btn fullscreen"
                          onClick={() => handleFullscreenPreview(file)}
                          title="전체화면으로 보기"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-files">등록된 PTW가 없습니다</div>
                )}
              </div>
            </div>

            {/* 현장 사진 */}
            <div className="attachment-category">
              <h4 className="attachment-category-title">현장 사진</h4>
              <div className="attachment-list">
                {(currentSite.photos || []).length > 0 ? (
                  currentSite.photos.map((file: any, index: number) => (
                    <div key={index} className="attachment-item">
                      <div className="attachment-info">
                        <div className="attachment-name">{file.name}</div>
                        <div className="attachment-meta">
                          <span>{file.date}</span>
                          {file.size && <span>{file.size}</span>}
                        </div>
                      </div>
                      <div className="attachment-actions">
                        <button
                          className="action-btn"
                          onClick={() => handleDownloadFile(file.name)}
                        >
                          <Download size={14} />
                          다운로드
                        </button>
                        <button
                          className="action-btn secondary"
                          onClick={() => handleFilePreview(file)}
                        >
                          미리보기
                        </button>
                        <button
                          className="action-btn fullscreen"
                          onClick={() => handleFullscreenPreview(file)}
                          title="전체화면으로 보기"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-files">등록된 현장 사진이 없습니다</div>
                )}
              </div>
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

      {/* Fullscreen File Modal */}
      {showFullscreen && fullscreenFile && (
        <div className="fullscreen-modal-overlay" onClick={() => setShowFullscreen(false)}>
          <div className="fullscreen-modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="fullscreen-close-btn"
              onClick={() => setShowFullscreen(false)}
              title="닫기"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="fullscreen-file-container">
              {fullscreenFile.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={fullscreenFile.url || `/api/placeholder/800/600`}
                  alt={fullscreenFile.name}
                  className="fullscreen-image"
                />
              ) : fullscreenFile.name.toLowerCase().endsWith('.pdf') ? (
                <div className="fullscreen-pdf">
                  <iframe
                    src={fullscreenFile.url || '#'}
                    title={fullscreenFile.name}
                    className="fullscreen-pdf-viewer"
                  />
                </div>
              ) : (
                <div className="fullscreen-document">
                  <div className="document-icon">📄</div>
                  <h3>{fullscreenFile.name}</h3>
                  <p>업로드: {fullscreenFile.date}</p>
                  <button
                    className="download-btn"
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = fullscreenFile.url || '#'
                      link.download = fullscreenFile.name
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                    }}
                  >
                    다운로드
                  </button>
                </div>
              )}
            </div>

            <div className="fullscreen-info">
              <h4>{fullscreenFile.name}</h4>
              <p>업로드: {fullscreenFile.date}</p>
            </div>
          </div>
        </div>
      )}

      {/* NPC Log Dialog - HTML dialog element */}
      <dialog ref={npcLogDialogRef} className="npc-dialog">
        <div className="npc-dialog-content">
          <div className="npc-dialog-header">
            <h3 className="npc-dialog-title">오늘의 NPC-1000 로그</h3>
            <button className="npc-dialog-close" onClick={() => npcLogDialogRef.current?.close()}>
              <X size={20} />
            </button>
          </div>
          <div className="npc-dialog-body">
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
                {npcCurrent &&
                  npcCurrent.logs
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
                {(!npcCurrent ||
                  npcCurrent.logs.filter(log => log.date === formatDate(new Date())).length ===
                    0) && (
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
      </dialog>

      {/* NPC Record Dialog - HTML dialog element with form */}
      <dialog ref={npcRecordDialogRef} className="npc-dialog">
        <form className="npc-dialog-content" onSubmit={handleSaveNpcRecord}>
          <div className="npc-dialog-header">
            <h3 className="npc-dialog-title">NPC-1000 기록 입력</h3>
            <button
              type="button"
              className="npc-dialog-close"
              onClick={() => npcRecordDialogRef.current?.close()}
            >
              <X size={20} />
            </button>
          </div>
          <div className="npc-dialog-body">
            <div className="npc-form-group">
              <label className="npc-form-label">현장</label>
              <select
                className="npc-form-select"
                value={npcFormData.site}
                onChange={e => setNpcFormData(prev => ({ ...prev, site: e.target.value }))}
                required
              >
                {npcSites.map(site => (
                  <option key={site.id} value={site.name}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="npc-form-group">
              <label className="npc-form-label">날짜</label>
              <input
                type="date"
                className="npc-form-input"
                value={npcFormData.date}
                onChange={e => setNpcFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="npc-form-group">
              <label className="npc-form-label">구분</label>
              <select
                className="npc-form-select"
                value={npcFormData.type}
                onChange={e =>
                  setNpcFormData(prev => ({ ...prev, type: e.target.value as 'in' | 'out' }))
                }
                required
              >
                <option value="in">입고</option>
                <option value="out">사용</option>
              </select>
            </div>
            <div className="npc-form-group">
              <label className="npc-form-label">수량</label>
              <input
                type="number"
                className="npc-form-input"
                value={npcFormData.qty}
                onChange={e => setNpcFormData(prev => ({ ...prev, qty: Number(e.target.value) }))}
                min="1"
                required
              />
            </div>
            <div className="npc-form-group">
              <label className="npc-form-label">메모</label>
              <textarea
                className="npc-form-textarea"
                value={npcFormData.memo}
                onChange={e => setNpcFormData(prev => ({ ...prev, memo: e.target.value }))}
                placeholder="메모를 입력하세요..."
                rows={3}
              />
            </div>
          </div>
          <div className="npc-dialog-actions">
            <button
              type="button"
              className="npc-btn npc-btn-secondary"
              onClick={() => npcRecordDialogRef.current?.close()}
            >
              취소
            </button>
            <button type="submit" className="npc-btn npc-btn-primary">
              저장
            </button>
          </div>
        </form>
      </dialog>

      {/* NPC Request Dialog - HTML dialog element with form */}
      <dialog ref={npcRequestDialogRef} className="npc-dialog">
        <form className="npc-dialog-content" onSubmit={handleSubmitNpcRequest}>
          <div className="npc-dialog-header">
            <h3 className="npc-dialog-title">NPC-1000 자재 요청</h3>
            <button
              type="button"
              className="npc-dialog-close"
              onClick={() => npcRequestDialogRef.current?.close()}
            >
              <X size={20} />
            </button>
          </div>
          <div className="npc-dialog-body">
            <div className="npc-form-group">
              <label className="npc-form-label">현장</label>
              <select
                className="npc-form-select"
                value={npcRequestData.site}
                onChange={e => setNpcRequestData(prev => ({ ...prev, site: e.target.value }))}
                required
              >
                <option value="">현장을 선택하세요</option>
                {npcSites.map(site => (
                  <option key={site.id} value={site.name}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="npc-form-group">
              <label className="npc-form-label">요청 수량</label>
              <input
                type="number"
                className="npc-form-input"
                value={npcRequestData.qty}
                onChange={e =>
                  setNpcRequestData(prev => ({ ...prev, qty: Number(e.target.value) }))
                }
                min="1"
                required
              />
            </div>
            <div className="npc-form-group">
              <label className="npc-form-label">요청 사유</label>
              <textarea
                className="npc-form-textarea"
                value={npcRequestData.memo}
                onChange={e => setNpcRequestData(prev => ({ ...prev, memo: e.target.value }))}
                placeholder="요청 사유를 입력하세요..."
                rows={4}
                required
              />
            </div>
          </div>
          <div className="npc-dialog-actions">
            <button
              type="button"
              className="npc-btn npc-btn-secondary"
              onClick={() => npcRequestDialogRef.current?.close()}
            >
              취소
            </button>
            <button type="submit" className="npc-btn npc-btn-primary">
              요청
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
