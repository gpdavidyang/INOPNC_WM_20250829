'use client'


interface ManagerContactsProps {
  managers: ManagerContact[]
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
}

export default function ManagerContacts({ 
  managers, 
  expanded = true,
  onExpandedChange 
}: ManagerContactsProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [isExpanded, setIsExpanded] = useState(expanded)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    setIsExpanded(expanded)
  }, [expanded])

  const toggleExpanded = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    onExpandedChange?.(newState)
  }

  const copyToClipboard = async (text: string, field: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      showToastMessage(`${label} 복사됨`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      showToastMessage('복사 실패')
    }
  }

  const showToastMessage = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const makePhoneCall = (phone: string) => {
    // Remove hyphens for tel: protocol
    const cleanPhone = phone.replace(/-/g, '')
    window.location.href = `tel:${cleanPhone}`
  }

  const sendEmail = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  const getInitials = (name: string): string => {
    const parts = name.split(' ')
    if (parts.length === 1) {
      // Korean name - take first character
      return name.charAt(0)
    }
    // Western name - take first letter of each part
    return parts.map(p => p.charAt(0)).join('').toUpperCase()
  }

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'construction_manager': return '현장소장'
      case 'assistant_manager': return '부소장'
      case 'safety_manager': return '안전관리자'
      default: return role
    }
  }

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'construction_manager': 
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'assistant_manager': 
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'safety_manager': 
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
      default: 
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  if (managers.length === 0) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg ${
        touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
      } text-center`}>
        <User className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>
          담당자 정보가 등록되지 않았습니다.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <button
          onClick={toggleExpanded}
          className={`w-full ${
            touchMode === 'glove' ? 'px-6 py-4' : touchMode === 'precision' ? 'px-3 py-2' : 'px-4 py-3'
          } flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation`}
        >
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
              담당자 연락처
            </span>
            <span className={`${getFullTypographyClass('caption', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
              ({managers.length}명)
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {/* Content */}
        {isExpanded && (
          <div className={`${
            touchMode === 'glove' ? 'p-6 pt-0' : touchMode === 'precision' ? 'p-3 pt-0' : 'p-4 pt-0'
          } space-y-3 animate-in slide-in-from-top-1 duration-200`}>
            {managers.map((manager: unknown) => (
              <ContactCard
                key={`${manager.role}-${manager.name}`}
                manager={manager}
                onCopy={copyToClipboard}
                onCall={makePhoneCall}
                onEmail={sendEmail}
                copiedField={copiedField}
                getInitials={getInitials}
                getRoleLabel={getRoleLabel}
                getRoleColor={getRoleColor}
                isLargeFont={isLargeFont}
                touchMode={touchMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)}`}>{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  )
}

// Individual Contact Card Component
interface ContactCardProps {
  manager: ManagerContact
  onCopy: (text: string, field: string, label: string) => void
  onCall: (phone: string) => void
  onEmail: (email: string) => void
  copiedField: string | null
  getInitials: (name: string) => string
  getRoleLabel: (role: string) => string
  getRoleColor: (role: string) => string
  isLargeFont: boolean
  touchMode: string
}

function ContactCard({
  manager,
  onCopy,
  onCall,
  onEmail,
  copiedField,
  getInitials,
  getRoleLabel,
  getRoleColor,
  isLargeFont,
  touchMode
}: ContactCardProps) {
  return (
    <div className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg ${
      touchMode === 'glove' ? 'p-6' : touchMode === 'precision' ? 'p-3' : 'p-4'
    } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {manager.profile_image ? (
            <img
              src={manager.profile_image}
              alt={manager.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium text-lg ${getRoleColor(manager.role)}`}>
              {getInitials(manager.name)}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>
              {manager.name}
            </h4>
            <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} px-2 py-0.5 rounded-full ${getRoleColor(manager.role)}`}>
              {getRoleLabel(manager.role)}
            </span>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400`}>
              {manager.phone}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => onCopy(manager.phone, `phone-${manager.role}`, '전화번호')}
                className={`p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all touch-manipulation ${
                  touchMode === 'glove' ? 'min-w-[56px] min-h-[56px]' : 
                  touchMode === 'precision' ? 'min-w-[44px] min-h-[44px]' : 
                  'min-w-[48px] min-h-[48px]'
                } flex items-center justify-center`}
                title="전화번호 복사"
              >
                {copiedField === `phone-${manager.role}` ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => onCall(manager.phone)}
                className={`p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-all touch-manipulation ${
                  touchMode === 'glove' ? 'min-w-[56px] min-h-[56px]' : 
                  touchMode === 'precision' ? 'min-w-[44px] min-h-[44px]' : 
                  'min-w-[48px] min-h-[48px]'
                } flex items-center justify-center`}
                title="전화 걸기"
              >
                <Phone className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Email (if available) */}
          {manager.email && (
            <div className="flex items-center gap-2">
              <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-600 dark:text-gray-400 truncate`}>
                {manager.email}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onCopy(manager.email!, `email-${manager.role}`, '이메일')}
                  className={`p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all touch-manipulation ${
                  touchMode === 'glove' ? 'min-w-[56px] min-h-[56px]' : 
                  touchMode === 'precision' ? 'min-w-[44px] min-h-[44px]' : 
                  'min-w-[48px] min-h-[48px]'
                } flex items-center justify-center`}
                  title="이메일 복사"
                >
                  {copiedField === `email-${manager.role}` ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => onEmail(manager.email!)}
                  className={`p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all touch-manipulation ${
                  touchMode === 'glove' ? 'min-w-[56px] min-h-[56px]' : 
                  touchMode === 'precision' ? 'min-w-[44px] min-h-[44px]' : 
                  'min-w-[48px] min-h-[48px]'
                } flex items-center justify-center`}
                  title="이메일 보내기"
                >
                  <Mail className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Swipeable Contact Card for Mobile (Enhanced version)
export function SwipeableContactCard({ manager }: { manager: ManagerContact }) {
  const [swipeX, setSwipeX] = useState(0)
  const [startX, setStartX] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    setSwipeX(Math.max(-100, Math.min(0, diff)))
  }

  const handleTouchEnd = () => {
    if (swipeX < -50) {
      setSwipeX(-100)
    } else {
      setSwipeX(0)
    }
  }

  return (
    <div className="relative overflow-hidden">
      <div
        className="transform transition-transform duration-200"
        style={{ transform: `translateX(${swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Card content here */}
      </div>
      
      {/* Swipe actions */}
      <div className="absolute right-0 top-0 h-full flex items-center">
        <button className="h-full px-6 bg-green-500 text-white">
          <Phone className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}