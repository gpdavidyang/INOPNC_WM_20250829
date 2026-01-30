import React, { useEffect, useState } from 'react'
import { ArrowLeft, Camera } from 'lucide-react'

interface AccountOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export const AccountOverlay: React.FC<AccountOverlayProps> = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      requestAnimationFrame(() => setIsVisible(true))
      document.body.style.overflow = 'hidden'
    } else {
      setIsVisible(false)
      document.body.style.overflow = ''
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleSave = () => {
    alert('저장되었습니다.')
    onClose()
  }

  const handleProfileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = ev => {
          const imgBox = document.getElementById('profile-preview')
          const letter = document.getElementById('profile-letter')
          if (imgBox && ev.target?.result) {
            imgBox.style.backgroundImage = `url(${ev.target.result})`
            if (letter) letter.style.display = 'none'
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  if (!shouldRender) return null

  return (
    <div
      className={`fixed inset-0 z-[2000] flex flex-col bg-[var(--bg-body)] text-[var(--text-main)] transition-colors transition-transform duration-300 cubic-bezier(0.33, 1, 0.68, 1) ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
    >
      {/* Header */}
      <div className="h-[60px] px-4 flex items-center justify-between bg-[var(--bg-surface)] border-b border-[var(--border)] shrink-0">
        <button
          onClick={onClose}
          className="p-1 bg-transparent border-none text-[var(--text-main)]"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="text-[20px] font-bold text-[var(--text-main)]">계정 관리</span>
        <button
          onClick={handleSave}
          className="text-[17px] font-bold text-primary bg-transparent border-none p-0 cursor-pointer"
        >
          저장
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto pb-20">
        {/* Profile Image */}
        <div className="flex flex-col items-center mb-8">
          <div
            id="profile-preview"
            className="w-[100px] h-[100px] rounded-full bg-slate-200 relative flex items-center justify-center text-[36px] font-bold text-slate-400 border-4 border-[var(--bg-surface)] shadow-md bg-cover bg-center"
          >
            <span id="profile-letter">이</span>
            <button
              onClick={handleProfileUpload}
              className="absolute bottom-0 right-0 w-[34px] h-[34px] rounded-full bg-header-navy text-white border-[3px] border-[var(--bg-surface)] flex items-center justify-center shadow-sm cursor-pointer"
            >
              <Camera size={16} />
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="mb-8">
          <span className="block text-[15px] font-bold text-text-sub mb-3">기본 정보</span>
          <div className="mb-4">
            <label className="block text-[17px] font-bold text-text-sub mb-1.5">이름</label>
            <input
              type="text"
              defaultValue="이현수"
              className="w-full h-[48px] px-3.5 border border-border rounded-xl text-[17px] text-[var(--text-main)] bg-[var(--bg-surface)] font-medium outline-none focus:border-primary"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[17px] font-bold text-text-sub mb-1.5">이메일</label>
            <input
              type="email"
              defaultValue="manager@inopnc.com"
              disabled
              className="w-full h-[48px] px-3.5 border border-border rounded-xl text-[17px] text-[var(--text-main)] bg-[var(--bg-surface)] font-medium opacity-70"
            />
          </div>
          <div className="mb-4">
            <label className="block text-[17px] font-bold text-text-sub mb-1.5">전화번호</label>
            <input
              type="tel"
              defaultValue="010-1234-5678"
              className="w-full h-[48px] px-3.5 border border-border rounded-xl text-[17px] text-[var(--text-main)] bg-[var(--bg-surface)] font-medium outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Security */}
        <div className="mb-8">
          <span className="block text-[15px] font-bold text-text-sub mb-3">보안 설정</span>
          <div className="mb-4">
            <label className="block text-[17px] font-bold text-text-sub mb-1.5">
              비밀번호 변경
            </label>
            <input
              type="password"
              placeholder="새 비밀번호 입력"
              className="w-full h-[48px] px-3.5 border border-border rounded-xl text-[17px] text-[var(--text-main)] bg-[var(--bg-surface)] font-medium outline-none focus:border-primary placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Settings */}
        <div className="mb-8">
          <span className="block text-[15px] font-bold text-text-sub mb-3">알림 설정</span>

          <div className="flex justify-between items-center py-4 border-b border-border">
            <span className="text-[17px] text-[var(--text-main)] font-medium">푸시 알림</span>
            <label className="relative inline-block w-[48px] h-[26px]">
              <input type="checkbox" defaultChecked className="opacity-0 w-0 h-0 peer" />
              <span className="absolute cursor-pointer inset-0 bg-slate-300 dark:bg-slate-600 rounded-[34px] transition-all duration-400 before:absolute before:content-[''] before:h-[20px] before:w-[20px] before:left-[3px] before:bottom-[3px] before:bg-[var(--bg-surface)] before:rounded-full before:transition-all before:duration-400 peer-checked:bg-primary peer-checked:before:translate-x-[22px]"></span>
            </label>
          </div>

          <div className="flex justify-between items-center py-4">
            <span className="text-[17px] text-[var(--text-main)] font-medium">이메일 수신</span>
            <label className="relative inline-block w-[48px] h-[26px]">
              <input type="checkbox" className="opacity-0 w-0 h-0 peer" />
              <span className="absolute cursor-pointer inset-0 bg-slate-300 dark:bg-slate-600 rounded-[34px] transition-all duration-400 before:absolute before:content-[''] before:h-[20px] before:w-[20px] before:left-[3px] before:bottom-[3px] before:bg-[var(--bg-surface)] before:rounded-full before:transition-all before:duration-400 peer-checked:bg-primary peer-checked:before:translate-x-[22px]"></span>
            </label>
          </div>
        </div>

        {/* Other */}
        <div className="mb-8">
          <span className="block text-[15px] font-bold text-text-sub mb-3">기타</span>
          <div className="flex justify-between mb-5">
            <span className="text-[14px] text-text-sub">앱 버전</span>
            <span className="text-[14px] text-[var(--text-main)] font-semibold">v1.2.0</span>
          </div>
          <button
            onClick={() => alert('회원 탈퇴')}
            className="text-[15px] font-bold text-danger bg-transparent border-none p-0 underline cursor-pointer"
          >
            회원 탈퇴
          </button>
        </div>
      </div>
    </div>
  )
}
