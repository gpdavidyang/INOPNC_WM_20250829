'use client'

import { Profile } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  User, Mail, Phone, Building2, Shield, Calendar, LogOut 
} from 'lucide-react'
import { signOut } from '@/app/auth/actions'

interface PartnerMyInfoTabProps {
  profile: Profile
}

export default function PartnerMyInfoTab({ profile }: PartnerMyInfoTabProps) {
  const handleSignOut = async () => {
    await signOut()
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'worker': '작업자',
      'site_manager': '현장관리자',
      'customer_manager': '파트너사',
      'admin': '관리자',
      'system_admin': '시스템관리자'
    }
    return roleMap[role] || role
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          내정보
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          계정 정보 및 설정을 관리합니다
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">프로필 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-white" />
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {profile.full_name || '이름 없음'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getRoleDisplayName(profile.role)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">이메일</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {profile.email || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">연락처</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {profile.phone || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">소속</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      파트너사
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">가입일</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">보안 설정</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <button className="w-full sm:w-auto px-4 py-2 bg-gray-100 dark:bg-gray-800 
              text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700
              transition-colors">
              비밀번호 변경
            </button>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSignOut}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg
                  hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">활동 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">3</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">참여 현장</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-green-600">24</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">관리 작업자</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">156</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">작업일지</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">89</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">등록 문서</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}