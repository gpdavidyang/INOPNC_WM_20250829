'use client'

import type { Profile } from '@/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AdminAccountSettingsProps {
  profile: Profile
  user: SupabaseUser
}

export function AdminAccountSettings({ profile, user }: AdminAccountSettingsProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // Password change states
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handlePasswordUpdate = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다')
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상이어야 합니다')
      return
    }
    
    setIsUpdatingPassword(true)
    setPasswordError('')
    
    try {
      const result = await updatePassword(currentPassword, newPassword)
      
      if (result.success) {
        setPasswordSuccess(true)
        setIsEditingPassword(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPasswordSuccess(false), 3000)
      } else {
        setPasswordError(result.error || '비밀번호 변경에 실패했습니다')
      }
    } catch (error) {
      setPasswordError('비밀번호 변경 중 오류가 발생했습니다')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const cancelPasswordEdit = () => {
    setIsEditingPassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'system_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const roleLabels: Record<string, string> = {
    admin: '본사 관리자',
    system_admin: '시스템 관리자'
  }

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card className={`${
        touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold flex items-center gap-2`}>
            <User className="h-5 w-5" />
            기본 정보
          </h2>
          <Badge className={getRoleBadgeColor(profile.role)}>
            <Shield className="h-3 w-3 mr-1" />
            {roleLabels[profile.role] || profile.role}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
              이름
            </Label>
            <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} mt-1`}>
              {profile.full_name || '-'}
            </p>
          </div>
          
          <div>
            <Label className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
              이메일
            </Label>
            <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} mt-1 flex items-center gap-2`}>
              <Mail className="h-4 w-4 text-gray-400" />
              {profile.email}
            </p>
          </div>
          
          <div>
            <Label className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
              전화번호
            </Label>
            <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} mt-1 flex items-center gap-2`}>
              <Phone className="h-4 w-4 text-gray-400" />
              {profile.phone || '-'}
            </p>
          </div>
          
          <div>
            <Label className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
              소속
            </Label>
            <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} mt-1 flex items-center gap-2`}>
              <Building2 className="h-4 w-4 text-gray-400" />
              {profile.role === 'admin' ? 'INOPNC' : '-'}
            </p>
          </div>
          
          <div>
            <Label className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
              계정 생성일
            </Label>
            <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} mt-1 flex items-center gap-2`}>
              <Calendar className="h-4 w-4 text-gray-400" />
              {profile.created_at ? format(new Date(profile.created_at), 'yyyy년 MM월 dd일', { locale: ko }) : '-'}
            </p>
          </div>
          
          <div>
            <Label className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
              사용자 ID
            </Label>
            <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} mt-1 font-mono text-gray-500`}>
              {profile.id}
            </p>
          </div>
        </div>
      </Card>

      {/* Security Settings Card */}
      <Card className={`${
        touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold flex items-center gap-2`}>
            <Lock className="h-5 w-5" />
            보안 설정
          </h2>
        </div>

        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-green-700 dark:text-green-300`}>
              비밀번호가 성공적으로 변경되었습니다
            </span>
          </div>
        )}

        {!isEditingPassword ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium`}>
                  비밀번호
                </p>
                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mt-1`}>
                  정기적으로 비밀번호를 변경하여 계정을 안전하게 보호하세요
                </p>
              </div>
              <Button
                onClick={() => setIsEditingPassword(true)}
                variant="outline"
                className={`${
                  touchMode === 'glove' ? 'px-5 py-3' : touchMode === 'precision' ? 'px-3 py-1.5' : 'px-4 py-2'
                }`}
              >
                <Key className="h-4 w-4 mr-2" />
                비밀번호 변경
              </Button>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} font-medium mb-2`}>
                2단계 인증
              </p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mb-4`}>
                추가 보안을 위해 2단계 인증을 설정하세요
              </p>
              <Button
                variant="outline"
                disabled
                className={`${
                  touchMode === 'glove' ? 'px-5 py-3' : touchMode === 'precision' ? 'px-3 py-1.5' : 'px-4 py-2'
                }`}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                2단계 인증 설정 (준비 중)
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {passwordError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-red-700 dark:text-red-300`}>
                  {passwordError}
                </span>
              </div>
            )}
            
            <div>
              <Label htmlFor="current-password" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                현재 비밀번호
              </Label>
              <div className="relative mt-1">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`pr-10 ${
                    touchMode === 'glove' ? 'h-14' : touchMode === 'precision' ? 'h-10' : 'h-12'
                  }`}
                  placeholder="현재 비밀번호 입력"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="new-password" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                새 비밀번호
              </Label>
              <div className="relative mt-1">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`pr-10 ${
                    touchMode === 'glove' ? 'h-14' : touchMode === 'precision' ? 'h-10' : 'h-12'
                  }`}
                  placeholder="새 비밀번호 입력 (최소 6자)"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="confirm-password" className={getFullTypographyClass('body', 'sm', isLargeFont)}>
                새 비밀번호 확인
              </Label>
              <div className="relative mt-1">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pr-10 ${
                    touchMode === 'glove' ? 'h-14' : touchMode === 'precision' ? 'h-10' : 'h-12'
                  }`}
                  placeholder="새 비밀번호 다시 입력"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handlePasswordUpdate}
                disabled={isUpdatingPassword}
                className={`flex-1 ${
                  touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1.5' : 'py-2'
                }`}
              >
                {isUpdatingPassword ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    변경 중...
                  </span>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    비밀번호 변경
                  </>
                )}
              </Button>
              <Button
                onClick={cancelPasswordEdit}
                variant="outline"
                disabled={isUpdatingPassword}
                className={`${
                  touchMode === 'glove' ? 'px-5 py-3' : touchMode === 'precision' ? 'px-3 py-1.5' : 'px-4 py-2'
                }`}
              >
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
            </div>
          </div>
        )}
      </Card>
      
      {/* Admin Features Card */}
      <Card className={`${
        touchMode === 'glove' ? 'p-8' : touchMode === 'precision' ? 'p-4' : 'p-6'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-semibold flex items-center gap-2`}>
            <Shield className="h-5 w-5" />
            관리자 권한
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>
                전체 시스템 접근
              </p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                모든 데이터와 설정에 대한 무제한 접근 권한
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>
                사용자 관리
              </p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                사용자 계정 생성, 수정, 삭제 권한
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium`}>
                시스템 설정
              </p>
              <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                시스템 전반의 설정 변경 및 구성 권한
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          
          {profile.role === 'system_admin' && (
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div>
                <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-purple-700 dark:text-purple-300`}>
                  시스템 관리자 전용
                </p>
                <p className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-purple-600 dark:text-purple-400`}>
                  데이터베이스 백업, 시스템 로그, 고급 설정 접근
                </p>
              </div>
              <Shield className="h-5 w-5 text-purple-500" />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}