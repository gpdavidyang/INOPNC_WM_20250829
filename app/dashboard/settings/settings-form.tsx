'use client'
import { createClient } from '@/lib/supabase/client'


interface SettingsFormProps {
  user: User
  profile: Profile
}

export default function SettingsForm({ user, profile }: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { isLargeFont, toggleFontSize } = useFontSize()
  const { touchMode, setTouchMode } = useTouchMode()
  const { isHighContrast, toggleHighContrast, isSunlightMode, toggleSunlightMode } = useContrastMode()
  
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Touch mode options for keyboard navigation
  const touchModeOptions = ['normal', 'glove', 'precision'] as const
  const { currentIndex: touchModeIndex, handleKeyDown: handleTouchModeKeyDown } = useKeyboardNavigation({
    items: touchModeOptions,
    onSelect: (index) => setTouchMode(touchModeOptions[index]),
    currentValue: touchMode,
    orientation: 'vertical'
  })

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: '프로필이 업데이트되었습니다.' })
      router.refresh()
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: formData.currentPassword
      })

      if (signInError) {
        throw new Error('현재 비밀번호가 올바르지 않습니다.')
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (error) throw error

      setMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' })
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: unknown) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`${
            touchMode === 'glove' ? 'p-5' : touchMode === 'precision' ? 'p-3' : 'p-4'
          } rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          } ${getFullTypographyClass('body', 'sm', isLargeFont)}`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Update Form */}
      <form onSubmit={handleProfileUpdate} className="space-y-4">
        <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-medium text-gray-900`}>프로필 정보</h2>
        
        <div>
          <label htmlFor="email" className={`block ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700`}>
            이메일
          </label>
          <input
            type="email"
            id="email"
            value={user.email}
            disabled
            className={`mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              touchMode === 'glove' ? 'py-4 px-5' : touchMode === 'precision' ? 'py-2 px-3' : 'py-3 px-4'
            } ${getFullTypographyClass('body', 'sm', isLargeFont)}`}
          />
        </div>

        <div>
          <label htmlFor="full_name" className={`block ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700`}>
            이름
          </label>
          <input
            type="text"
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              touchMode === 'glove' ? 'py-4 px-5' : touchMode === 'precision' ? 'py-2 px-3' : 'py-3 px-4'
            } ${getFullTypographyClass('body', 'sm', isLargeFont)}`}
          />
        </div>

        <div>
          <label htmlFor="phone" className={`block ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700`}>
            전화번호
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              touchMode === 'glove' ? 'py-4 px-5' : touchMode === 'precision' ? 'py-2 px-3' : 'py-3 px-4'
            } ${getFullTypographyClass('body', 'sm', isLargeFont)}`}
          />
        </div>

        <div>
          <label className={`block ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700`}>
            역할
          </label>
          <p className={`mt-1 ${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-900`}>{profile.role}</p>
        </div>

        <div>
          <label className={`block ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 mb-2`}>
            글꼴 크기
          </label>
          <div className={`flex items-center justify-between ${
            touchMode === 'glove' ? 'p-4' : touchMode === 'precision' ? 'p-2.5' : 'p-3'
          } bg-gray-50 rounded-lg`}>
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-900`}>큰 글꼴 사용</p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>텍스트를 더 크게 표시합니다</p>
            </div>
            <button
              type="button"
              onClick={toggleFontSize}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isLargeFont ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isLargeFont ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div>
          <label 
            id="touch-mode-label"
            className={`block ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 mb-2`}
          >
            터치 모드
          </label>
          <div 
            className="space-y-2"
            role="radiogroup"
            aria-labelledby="touch-mode-label"
            onKeyDown={handleTouchModeKeyDown}
          >
            <div 
              role="radio"
              tabIndex={touchMode === 'normal' ? 0 : -1}
              aria-checked={touchMode === 'normal'}
              onClick={() => setTouchMode('normal')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setTouchMode('normal')
                }
                handleTouchModeKeyDown(e)
              }}
              className={`flex items-center justify-between ${
                touchMode === 'glove' ? 'p-4' : touchMode === 'precision' ? 'p-2.5' : 'p-3'
              } rounded-lg cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 ${
                touchMode === 'normal' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-900`}>일반 모드</p>
                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>기본 터치 크기 (48px)</p>
              </div>
              {touchMode === 'normal' && (
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              )}
            </div>
            
            <div 
              role="radio"
              tabIndex={touchMode === 'glove' ? 0 : -1}
              aria-checked={touchMode === 'glove'}
              onClick={() => setTouchMode('glove')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setTouchMode('glove')
                }
                handleTouchModeKeyDown(e)
              }}
              className={`flex items-center justify-between ${
                touchMode === 'glove' ? 'p-4' : touchMode === 'precision' ? 'p-2.5' : 'p-3'
              } rounded-lg cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 ${
                touchMode === 'glove' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-900`}>장갑 모드</p>
                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>큰 터치 영역 (56px) - 현장 작업용</p>
              </div>
              {touchMode === 'glove' && (
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              )}
            </div>
            
            <div 
              role="radio"
              tabIndex={touchMode === 'precision' ? 0 : -1}
              aria-checked={touchMode === 'precision'}
              onClick={() => setTouchMode('precision')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setTouchMode('precision')
                }
                handleTouchModeKeyDown(e)
              }}
              className={`flex items-center justify-between ${
                touchMode === 'glove' ? 'p-4' : touchMode === 'precision' ? 'p-2.5' : 'p-3'
              } rounded-lg cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-2 ${
                touchMode === 'precision' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-900`}>정밀 모드</p>
                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>작은 터치 영역 (44px) - 정밀 작업용</p>
              </div>
              {touchMode === 'precision' && (
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className={`block ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 mb-2`}>
            대비 모드
          </label>
          <div className="space-y-2">
            <div className={`flex items-center justify-between ${
              touchMode === 'glove' ? 'p-4' : touchMode === 'precision' ? 'p-2.5' : 'p-3'
            } bg-gray-50 rounded-lg`}>
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-900`}>고대비 모드</p>
                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>현장의 열악한 조명 환경에서 가독성 향상</p>
              </div>
              <button
                type="button"
                onClick={toggleHighContrast}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isHighContrast ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isHighContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className={`flex items-center justify-between ${
              touchMode === 'glove' ? 'p-4' : touchMode === 'precision' ? 'p-2.5' : 'p-3'
            } bg-gray-50 rounded-lg`}>
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-900`}>햇빛 모드</p>
                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500`}>야외 강한 햇빛 아래에서 화면 가독성 향상</p>
              </div>
              <button
                type="button"
                onClick={toggleSunlightMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isSunlightMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isSunlightMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`inline-flex justify-center ${
            touchMode === 'glove' ? 'py-3 px-6' : touchMode === 'precision' ? 'py-1.5 px-3' : 'py-2 px-4'
          } border border-transparent shadow-sm ${getFullTypographyClass('button', 'base', isLargeFont)} font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
        >
          프로필 업데이트
        </button>
      </form>

      {/* Password Change Form */}
      <form onSubmit={handlePasswordChange} className="space-y-4 pt-6 border-t">
        <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-medium text-gray-900`}>비밀번호 변경</h2>
        
        <div>
          <label htmlFor="currentPassword" className={`block ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700`}>
            현재 비밀번호
          </label>
          <input
            type="password"
            id="currentPassword"
            value={formData.currentPassword}
            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              touchMode === 'glove' ? 'py-4 px-5' : touchMode === 'precision' ? 'py-2 px-3' : 'py-3 px-4'
            } ${getFullTypographyClass('body', 'sm', isLargeFont)}`}
          />
        </div>

        <div>
          <label htmlFor="newPassword" className={`block ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700`}>
            새 비밀번호
          </label>
          <input
            type="password"
            id="newPassword"
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              touchMode === 'glove' ? 'py-4 px-5' : touchMode === 'precision' ? 'py-2 px-3' : 'py-3 px-4'
            } ${getFullTypographyClass('body', 'sm', isLargeFont)}`}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className={`block ${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700`}>
            새 비밀번호 확인
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              touchMode === 'glove' ? 'py-4 px-5' : touchMode === 'precision' ? 'py-2 px-3' : 'py-3 px-4'
            } ${getFullTypographyClass('body', 'sm', isLargeFont)}`}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
          className={`inline-flex justify-center ${
            touchMode === 'glove' ? 'py-3 px-6' : touchMode === 'precision' ? 'py-1.5 px-3' : 'py-2 px-4'
          } border border-transparent shadow-sm ${getFullTypographyClass('button', 'base', isLargeFont)} font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
        >
          비밀번호 변경
        </button>
      </form>
    </div>
  )
}