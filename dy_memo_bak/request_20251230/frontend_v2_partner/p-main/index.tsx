import React, { useState, useRef, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Pencil,
  Square,
  Type,
  Stamp,
  Eraser,
  Map as MapIcon,
  Camera,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  Menu,
  CheckCircle2,
  Circle,
  Triangle,
  Star,
  Slash,
  ChevronRight,
  MapPin,
  Users,
  Phone,
  ArrowLeft,
  Cloud,
  CloudRain,
  Sun,
} from 'lucide-react'

// --- Types ---
type Tab = 'DASHBOARD' | 'DRAWING' | 'PHOTO' | 'PTW' | 'LOG' | 'ACTION'
type ToolType = 'SELECT' | 'RECT' | 'BRUSH' | 'STAMP' | 'TEXT'
type StampShape = 'circle' | 'square' | 'triangle' | 'star' | 'diagonal'

interface Point {
  x: number
  y: number
}

interface Annotation {
  id: string
  type: 'rect' | 'brush' | 'stamp' | 'text'
  color: string
  points?: Point[]
  x?: number
  y?: number
  width?: number
  height?: number
  text?: string
  shape?: StampShape
}

interface SiteData {
  id: number
  name: string
  status: 'ing' | 'wait'
  days: number
  mp: number
  address: string
  worker: number
  manager: string
  safety: string
  affil: string
  lastUpdate: string
  hasDraw: boolean
  hasPhoto: boolean
  hasPTW: boolean
  hasLog: boolean
  hasAction: boolean
}

// --- Mock Data for Dashboard ---
const mySites: SiteData[] = [
  {
    id: 1,
    name: '성수자이 아파트 101동',
    status: 'ing',
    days: 120,
    mp: 450,
    address: '서울 성동구 성수동 1가 12-3',
    worker: 8,
    manager: '이현수',
    safety: '김안전',
    affil: '수도권',
    lastUpdate: '2025-12-24 08:30',
    hasDraw: true,
    hasPhoto: true,
    hasPTW: true,
    hasLog: true,
    hasAction: false,
  },
  {
    id: 2,
    name: '강남 타워 리모델링',
    status: 'wait',
    days: 45,
    mp: 120,
    address: '서울 강남구 역삼동 123-45',
    worker: 3,
    manager: '박현장',
    safety: '최안전',
    affil: '본사',
    lastUpdate: '2025-12-24 09:00',
    hasDraw: true,
    hasPhoto: false,
    hasPTW: false,
    hasLog: true,
    hasAction: true,
  },
]

const notices = [
  {
    type: '공지',
    text: '동절기 현장 안전 관리 지침이 업데이트 되었습니다.',
    badgeClass: 'badge-notice',
  },
  {
    type: '업데이트',
    text: '작업완료확인서 PDF 저장 기능이 개선되었습니다.',
    badgeClass: 'badge-update',
  },
  { type: '안내', text: '금일 전국 현장 강추위 주의 바랍니다.', badgeClass: 'badge-notice' },
]

// --- Weather Service ---
const getWeather = (address: string) => {
  if (address.includes('서울')) return { text: '흐림 2°C', icon: <Cloud size={14} /> }
  if (address.includes('경기')) return { text: '비 4°C', icon: <CloudRain size={14} /> }
  if (address.includes('부산')) return { text: '맑음 8°C', icon: <Sun size={14} /> }
  if (address.includes('강남')) return { text: '맑음 3°C', icon: <Sun size={14} /> }
  return { text: '맑음 3°C', icon: <Sun size={14} /> }
}

// --- Main App Component ---
function App() {
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD')

  // Render active tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'DASHBOARD':
        return <Dashboard onNavigate={setActiveTab} />
      case 'DRAWING':
        return <DrawingModule onBack={() => setActiveTab('DASHBOARD')} />
      case 'PHOTO':
        return (
          <PlaceholderModule
            title="사진 관리 (Photo)"
            icon={<Camera size={48} />}
            onBack={() => setActiveTab('DASHBOARD')}
          />
        )
      case 'PTW':
        return (
          <PlaceholderModule
            title="작업 허가서 (PTW)"
            icon={<FileText size={48} />}
            onBack={() => setActiveTab('DASHBOARD')}
          />
        )
      case 'LOG':
        return (
          <PlaceholderModule
            title="작업 일지 (Daily Log)"
            icon={<ClipboardCheck size={48} />}
            onBack={() => setActiveTab('DASHBOARD')}
          />
        )
      case 'ACTION':
        return (
          <PlaceholderModule
            title="조치 사항 (Action)"
            icon={<AlertTriangle size={48} />}
            onBack={() => setActiveTab('DASHBOARD')}
          />
        )
      default:
        return <Dashboard onNavigate={setActiveTab} />
    }
  }

  return (
    // Removed 'font-sans' and 'text-[#111]' to allow global CSS variables to apply correctly
    <div className={`h-screen bg-[#f2f4f6] overflow-hidden flex flex-col`}>{renderContent()}</div>
  )
}

// --- Dashboard Component (The @pmain Mirror) ---
function Dashboard({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [noticeIdx, setNoticeIdx] = useState(0)

  // Date String
  const now = new Date()
  const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} (${['일', '월', '화', '수', '목', '금', '토'][now.getDay()]})`

  // Notice Slider Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setNoticeIdx(prev => (prev + 1) % notices.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="dashboard-wrapper h-full overflow-y-auto no-scrollbar">
      {/* Quick Menu */}
      <section className="quick-menu-section">
        <div className="qm-header">
          <div className="qm-title-group">
            <img
              src="https://postfiles.pstatic.net/MjAyNTA5MDlfMjYz/MDAxNzU3MzczOTIzNjUy.938EaPjiHzNGNoECgw9vItJhy_4pR6ZYVq3-8Z3tJecg.pSbWcXNy1U9El6kYe8OpwKmCEwkZiWJUiIM2R1qL2Swg.PNG/Flash.png?type=w966"
              alt="빠른메뉴"
              className="qm-title-icon-img"
            />
            <span className="qm-title">빠른메뉴</span>
          </div>
        </div>
        <div className="qm-grid">
          <QuickMenuItem
            label="현장정보"
            imgUrl="https://postfiles.pstatic.net/MjAyNTA5MDlfMTg4/MDAxNzU3MzczOTIzNjQ4.t3FLSpag_6badT7CAFsHXFj2wTbUWJh_3iHKxWR1DEwg.80vrXfmE4WGWg206E9n0XibJFSkfk1RkUr-lDpzyXh4g.PNG/%ED%98%84%EC%9E%A5%EC%A0%95%EB%B3%B4.png?type=w966"
          />
          <QuickMenuItem
            label="작업일지"
            badge="3"
            badgeClass="worklog"
            imgUrl="https://postfiles.pstatic.net/MjAyNTA5MDlfNDIg/MDAxNzU3MzczOTIzOTE5.uKHob9PU2yFuDqyYrTvUYHunByHEBj0A7pUASU7CEREg.3-0zMZk_TTNxnCDNBVAvSSxeGYcWdeot0GzIWhgD72Ug.PNG/%EC%9E%91%EC%97%85%EC%9D%BC%EC%A7%80.png?type=w966"
          />
          <QuickMenuItem
            label="출력현황"
            imgUrl="https://postfiles.pstatic.net/MjAyNTA5MDlfMzMg/MDAxNzU3MzczOTIzOTg2.eKgzH2aeZVhrEtYCSg-Vjyuok2eudz505Ck18_zeqpsg.r-W69aHdwVPEBS58wMg5LyR7-mDy3WaW_Yyt9I-Ax8kg.PNG/%EC%B6%9C%EB%A0%A5%ED%98%84%ED%99%A9.png?type=w966"
          />
          <QuickMenuItem
            label="문서함"
            imgUrl="https://postfiles.pstatic.net/MjAyNTA5MDlfMjc2/MDAxNzU3MzczOTIzNjUx.O1t90awoAKjRWjXhHYAnUEen68ptahXE1NWbYNvjy8Yg.440PWbQoaCp1dpPCgCvnlKU8EASGSAXMHb0zGEKnLHkg.PNG/%EB%AC%B8%EC%84%9C%ED%95%A8.png?type=w966"
          />
          <QuickMenuItem
            label="본사요청"
            badge="2"
            badgeClass="req"
            imgUrl="https://postfiles.pstatic.net/MjAyNTA5MDlfNjEg/MDAxNzU3MzczOTIzODI4.vHsIasE2fPt-A9r28ui5Sw7oGf9JXhxetAh96TdAHgcg.iV39dkzonq61Z_hvu1O1-FLwCNFqM-OCqrNDwN3EuI8g.PNG/%EB%B3%B8%EC%82%AC%EC%9A%94%EC%B2%AD.png?type=w966"
          />
        </div>
      </section>

      {/* Notice Slider */}
      <div className="notice-slider-container">
        <div className="notice-wrapper">
          {notices.map((n, i) => (
            <div
              key={i}
              className={`notice-item ${i === noticeIdx ? 'active' : i === (noticeIdx - 1 + notices.length) % notices.length ? 'prev' : ''}`}
            >
              <span className={`notice-badge ${n.badgeClass}`}>{n.type}</span>
              <span className="notice-text">{n.text}</span>
            </div>
          ))}
        </div>
        <ChevronRight style={{ width: 18, color: 'var(--text-sub)' }} />
      </div>

      {/* Summary Card */}
      <div className="summary-card-box">
        <div className="summary-header">
          <div className="summary-title-group">
            <MapPin style={{ width: 20, color: 'var(--navy-dark)' }} />
            <span className="summary-title">현장 관리</span>
          </div>
          <div className="summary-header-right">
            <span className="summary-date-badge">{dateStr}</span>
            <button className="summary-view-all">
              전체보기 <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="site-status-list">
          {mySites.map(s => (
            <div key={s.id} className="site-status-item">
              <span className="ss-name">{s.name}</span>
              <span className="ss-count">
                <Users style={{ width: 18 }} /> {s.worker}명
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Site Cards List */}
      <div>
        {mySites.map(s => {
          const weather = getWeather(s.address)
          return (
            <div key={s.id} className="site-card">
              <span className={`site-badge ${s.status === 'ing' ? 'bdg-ing' : 'bdg-wait'}`}>
                {s.status === 'ing' ? '진행중' : '예정'}
              </span>
              <div className="card-header">
                <span className="card-meta-time">{s.lastUpdate}</span>
                <div className="site-name-text">{s.name}</div>
                <div className="site-sub-info">
                  <div className="sub-group-left">
                    <span className="sub-badge">{s.affil}</span>
                    <span className="weather-badge">
                      {weather.icon}
                      {weather.text}
                    </span>
                  </div>
                  <div className="indicator-group">
                    <MapIcon className={`data-icon ${s.hasDraw ? 'active' : ''}`} />
                    <Camera className={`data-icon ${s.hasPhoto ? 'active' : ''}`} />
                    <FileText className={`data-icon ${s.hasPTW ? 'active' : ''}`} />
                    <ClipboardCheck className={`data-icon ${s.hasLog ? 'active' : ''}`} />
                    <CheckCircle2 className={`data-icon ${s.hasAction ? 'active' : ''}`} />
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="stats-row">
                  <div className="stat-box">
                    <span className="stat-label">작업일 누계</span>
                    <span className="stat-val">{s.days}일</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">누적 출력</span>
                    <span className="stat-val blue">{s.mp}명</span>
                  </div>
                </div>
                <div className="contact-row-simple">
                  <span className="c-label">현장소장</span>
                  <span className="c-val">{s.manager} 소장</span>
                  <button className="btn-icon-sm">
                    <Phone size={16} />
                  </button>
                </div>
                <div className="contact-row-simple">
                  <span className="c-label">안전담당</span>
                  <span className="c-val">{s.safety} 과장</span>
                  <button className="btn-icon-sm">
                    <Phone size={16} />
                  </button>
                </div>
                <div className="contact-row-simple">
                  <span className="c-label">주소</span>
                  <span className="c-val">{s.address}</span>
                  <button className="btn-icon-sm">
                    <MapPin size={16} />
                  </button>
                </div>

                {/* ACTION GRID - Wired to Navigation */}
                <div className="action-grid">
                  <button
                    className="act-btn type-draw"
                    onClick={() => (window.location.href = 'preview.html')}
                  >
                    <MapIcon className="act-icon" />
                    <span className="act-label">도면</span>
                  </button>
                  <button
                    className="act-btn type-photo"
                    onClick={() => (window.location.href = 'preview.html')}
                  >
                    <Camera className="act-icon" />
                    <span className="act-label">사진</span>
                  </button>
                  <button
                    className="act-btn type-ptw"
                    onClick={() => (window.location.href = 'preview.html')}
                  >
                    <FileText className="act-icon" />
                    <span className="act-label">PTW</span>
                  </button>
                  <button
                    className="act-btn type-log"
                    onClick={() => (window.location.href = 'preview.html')}
                  >
                    <ClipboardCheck className="act-icon" />
                    <span className="act-label">일지</span>
                  </button>
                  <button
                    className="act-btn type-action"
                    onClick={() => (window.location.href = 'preview.html')}
                  >
                    <CheckCircle2 className="act-icon" />
                    <span className="act-label">조치</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const QuickMenuItem = ({ label, imgUrl, badge, badgeClass }: any) => (
  <div className="qm-item">
    <div className="qm-icon-wrapper">
      {badge && <span className={`qm-badge ${badgeClass}`}>{badge}</span>}
      <img className="qm-main-icon" src={imgUrl} alt={label} />
    </div>
    <span className="qm-label">{label}</span>
  </div>
)

// --- Drawing Module (DMM2) ---
function DrawingModule({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // State
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [currentTool, setCurrentTool] = useState<ToolType>('SELECT')
  const [selectedColor, setSelectedColor] = useState('#ef4444')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [currentStamp, setCurrentStamp] = useState<StampShape>('circle')

  // Drawing state interactions
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<Point | null>(null)
  const [currentPath, setCurrentPath] = useState<Point[]>([])

  // Load default image on mount
  useEffect(() => {
    const img = new Image()
    img.src =
      'https://images.unsplash.com/photo-1580982327559-c1202864eb05?auto=format&fit=crop&q=80&w=1000'
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setBgImage(img)
    }
  }, [])

  // Redraw Canvas
  useEffect(() => {
    redraw()
  }, [bgImage, annotations, currentPath, isDrawing])

  // Handle resize
  useEffect(() => {
    const handleResize = () => requestAnimationFrame(redraw)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [bgImage])

  const redraw = () => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = container.clientWidth
    canvas.height = container.clientHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (bgImage) {
      const scale = Math.min(canvas.width / bgImage.width, canvas.height / bgImage.height)
      const x = canvas.width / 2 - (bgImage.width / 2) * scale
      const y = canvas.height / 2 - (bgImage.height / 2) * scale
      ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale)
    }

    annotations.forEach(ann => drawAnnotation(ctx, ann))

    if (isDrawing && startPos) {
      ctx.strokeStyle = selectedColor
      ctx.lineWidth = strokeWidth
    }

    if (isDrawing && currentTool === 'BRUSH' && currentPath.length > 0) {
      ctx.beginPath()
      ctx.moveTo(currentPath[0].x, currentPath[0].y)
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y)
      }
      ctx.strokeStyle = selectedColor
      ctx.lineWidth = strokeWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }

    // Rect Preview
    if (isDrawing && currentTool === 'RECT' && startPos && currentPath.length > 0) {
      const lastPos = currentPath[currentPath.length - 1]
      ctx.strokeStyle = selectedColor
      ctx.lineWidth = strokeWidth
      ctx.setLineDash([5, 5])
      ctx.strokeRect(startPos.x, startPos.y, lastPos.x - startPos.x, lastPos.y - startPos.y)
      ctx.setLineDash([])
    }
  }

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
    ctx.strokeStyle = ann.color
    ctx.fillStyle = ann.color
    ctx.lineWidth = 3

    if (ann.type === 'rect' && ann.x !== undefined && ann.width !== undefined) {
      ctx.strokeRect(ann.x, ann.y!, ann.width, ann.height!)
      ctx.globalAlpha = 0.1
      ctx.fillRect(ann.x, ann.y!, ann.width, ann.height!)
      ctx.globalAlpha = 1.0
    } else if (ann.type === 'brush' && ann.points) {
      ctx.beginPath()
      ctx.moveTo(ann.points[0].x, ann.points[0].y)
      for (let i = 1; i < ann.points.length; i++) {
        ctx.lineTo(ann.points[i].x, ann.points[i].y)
      }
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    } else if (ann.type === 'stamp' && ann.x !== undefined) {
      drawStamp(ctx, ann.shape || 'circle', ann.x, ann.y!, 40, ann.color)
    } else if (ann.type === 'text' && ann.x !== undefined) {
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(ann.text || '', ann.x, ann.y!)
    }
  }

  const drawStamp = (
    ctx: CanvasRenderingContext2D,
    shape: StampShape,
    x: number,
    y: number,
    size: number,
    color: string
  ) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 3

    ctx.beginPath()
    switch (shape) {
      case 'circle':
        ctx.arc(x, y, size / 2, 0, Math.PI * 2)
        ctx.stroke()
        break
      case 'square':
        ctx.rect(x - size / 2, y - size / 2, size, size)
        ctx.stroke()
        break
      case 'triangle':
        ctx.moveTo(x, y - size / 2)
        ctx.lineTo(x + size / 2, y + size / 2)
        ctx.lineTo(x - size / 2, y + size / 2)
        ctx.closePath()
        ctx.stroke()
        break
      case 'star':
        drawStar(ctx, x, y, 5, size / 2, size / 4)
        ctx.stroke()
        break
      case 'diagonal':
        ctx.moveTo(x - size / 2, y - size / 2)
        ctx.lineTo(x + size / 2, y + size / 2)
        ctx.stroke()
        break
    }
  }

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = (Math.PI / 2) * 3
    let x = cx
    let y = cy
    let step = Math.PI / spikes

    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
  }

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // e.preventDefault(); // removed to allow some touch action if needed, but typically needed for drawing
    if (e.cancelable) e.preventDefault()
    if (currentTool === 'SELECT') return

    const pos = getPos(e)
    setIsDrawing(true)
    setStartPos(pos)

    if (currentTool === 'BRUSH') {
      setCurrentPath([pos])
    } else if (currentTool === 'RECT') {
      setCurrentPath([pos]) // Use path to track current drag pos
    } else if (currentTool === 'STAMP') {
      const newStamp: Annotation = {
        id: Date.now().toString(),
        type: 'stamp',
        shape: currentStamp,
        x: pos.x,
        y: pos.y,
        color: selectedColor,
        width: 40,
        height: 40,
      }
      setAnnotations(prev => [...prev, newStamp])
      setIsDrawing(false)
    } else if (currentTool === 'TEXT') {
      const text = prompt('텍스트를 입력하세요 (Enter text):')
      if (text) {
        const newText: Annotation = {
          id: Date.now().toString(),
          type: 'text',
          text: text,
          x: pos.x,
          y: pos.y,
          color: selectedColor,
        }
        setAnnotations(prev => [...prev, newText])
      }
      setIsDrawing(false)
    }
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault()
    if (!isDrawing || !startPos) return

    const pos = getPos(e)

    if (currentTool === 'BRUSH' || currentTool === 'RECT') {
      setCurrentPath(prev => [...prev, pos])
    }
  }

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault()
    if (!isDrawing || !startPos) return

    // For rect, we need the last position from currentPath
    const lastPos = currentPath.length > 0 ? currentPath[currentPath.length - 1] : startPos

    if (currentTool === 'BRUSH') {
      if (currentPath.length > 1) {
        const newBrush: Annotation = {
          id: Date.now().toString(),
          type: 'brush',
          points: currentPath,
          color: selectedColor,
        }
        setAnnotations(prev => [...prev, newBrush])
      }
    } else if (currentTool === 'RECT') {
      if (Math.abs(lastPos.x - startPos.x) > 5 && Math.abs(lastPos.y - startPos.y) > 5) {
        const newRect: Annotation = {
          id: Date.now().toString(),
          type: 'rect',
          x: startPos.x,
          y: startPos.y,
          width: lastPos.x - startPos.x,
          height: lastPos.y - startPos.y,
          color: selectedColor,
        }
        setAnnotations(prev => [...prev, newRect])
      }
    }

    setIsDrawing(false)
    setStartPos(null)
    setCurrentPath([])
    redraw()
  }

  const handleClear = () => {
    if (confirm('모든 마크업을 지우시겠습니까? (Clear all markup?)')) {
      setAnnotations([])
    }
  }

  return (
    <div className="flex flex-col h-full bg-white animate-fadeIn">
      {/* Module Header with Back Button */}
      <header className="bg-blue-900 text-white p-3 flex items-center gap-3 shadow-md z-10">
        <button onClick={onBack} className="p-1 hover:bg-blue-800 rounded">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-lg">도면 마킹 (DMM2)</h1>
      </header>

      {/* Top Controls Bar */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex bg-white rounded-lg border border-gray-300 p-1 shadow-sm">
            <ToolBtn
              active={currentTool === 'RECT'}
              onClick={() => setCurrentTool('RECT')}
              icon={<Square size={20} />}
              label="구역"
            />
            <ToolBtn
              active={currentTool === 'BRUSH'}
              onClick={() => setCurrentTool('BRUSH')}
              icon={<Pencil size={20} />}
              label="펜"
            />
            <ToolBtn
              active={currentTool === 'STAMP'}
              onClick={() => setCurrentTool('STAMP')}
              icon={<Stamp size={20} />}
              label="도장"
            />
            <ToolBtn
              active={currentTool === 'TEXT'}
              onClick={() => setCurrentTool('TEXT')}
              icon={<Type size={20} />}
              label="문자"
            />
          </div>

          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-300 p-1 shadow-sm px-2">
            {['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#000000'].map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full border-2 ${selectedColor === color ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium transition-colors"
          >
            <Eraser size={16} />
            <span className="hidden sm:inline">지우기 (Clear)</span>
          </button>
        </div>
      </div>

      {currentTool === 'STAMP' && (
        <div className="bg-blue-50 p-2 border-b border-blue-100 flex items-center gap-4 animate-fadeIn">
          <span className="text-xs font-bold text-blue-800 uppercase px-2">도장 선택:</span>
          <div className="flex gap-2">
            <StampOption
              shape="circle"
              label="원"
              current={currentStamp}
              set={setCurrentStamp}
              icon={<Circle size={16} />}
            />
            <StampOption
              shape="square"
              label="네모"
              current={currentStamp}
              set={setCurrentStamp}
              icon={<Square size={16} />}
            />
            <StampOption
              shape="triangle"
              label="세모"
              current={currentStamp}
              set={setCurrentStamp}
              icon={<Triangle size={16} />}
            />
            <StampOption
              shape="star"
              label="별"
              current={currentStamp}
              set={setCurrentStamp}
              icon={<Star size={16} />}
            />
            <StampOption
              shape="diagonal"
              label="대각선"
              current={currentStamp}
              set={setCurrentStamp}
              icon={<Slash size={16} />}
            />
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 relative bg-gray-200 overflow-hidden touch-none cursor-crosshair"
      >
        {!bgImage && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            이미지 로딩중...
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute inset-0 w-full h-full block"
        />

        <div className="absolute top-4 left-4 bg-white/90 p-3 rounded shadow-lg backdrop-blur-sm max-w-[200px] pointer-events-none">
          <h3 className="text-xs font-bold text-gray-500 mb-1">작업내용 (Work Content)</h3>
          <p className="text-sm font-semibold">배관 설치 및 용접 작업</p>
        </div>
        <div className="absolute top-4 right-4 bg-white/90 p-3 rounded shadow-lg backdrop-blur-sm max-w-[150px] pointer-events-none">
          <h3 className="text-xs font-bold text-gray-500 mb-1">공수 (Manpower)</h3>
          <div className="flex justify-between text-sm">
            <span>금일:</span> <span className="font-bold text-blue-600">12명</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>누적:</span> <span className="font-bold text-gray-800">145명</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Placeholder for other tabs ---
const PlaceholderModule = ({
  title,
  icon,
  onBack,
}: {
  title: string
  icon: React.ReactNode
  onBack: () => void
}) => (
  <div className="flex flex-col h-full">
    <header className="bg-blue-900 text-white p-3 flex items-center gap-3 shadow-md z-10">
      <button onClick={onBack} className="p-1 hover:bg-blue-800 rounded">
        <ArrowLeft size={24} />
      </button>
      <h1 className="font-bold text-lg">{title.split('(')[0]}</h1>
    </header>
    <div className="flex flex-col items-center justify-center flex-1 text-gray-400 bg-gray-50 p-6">
      <div className="mb-4 text-gray-300">{icon}</div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm text-center">
        이 모듈은 현재 준비 중입니다.
        <br />
        (The module is under construction)
      </p>
    </div>
  </div>
)

// --- Helpers ---
const ToolBtn = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-md min-w-[50px] transition-all ${active ? 'bg-blue-100 text-blue-700 shadow-inner' : 'text-gray-600 hover:bg-gray-100'}`}
  >
    {icon}
    <span className="text-[10px] mt-0.5 font-medium">{label}</span>
  </button>
)

const StampOption = ({ shape, label, current, set, icon }: any) => (
  <button
    onClick={() => set(shape)}
    className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${current === shape ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
)

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
