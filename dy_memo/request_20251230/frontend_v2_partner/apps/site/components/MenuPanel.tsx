import React, { useEffect, useState } from 'react'

interface MenuPanelProps {
  isOpen: boolean
  onClose: () => void
  onOpenAccount: () => void
}

export const MenuPanel: React.FC<MenuPanelProps> = ({ isOpen, onClose, onOpenAccount }) => {
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

  if (!shouldRender) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[2000] bg-black/40 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer Panel (Left Slide) */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-[85%] max-w-[320px] bg-[var(--bg-surface)] z-[2500] flex flex-col transition-transform duration-300 shadow-2xl ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* User Info Header */}
        <div className="p-6 pb-8 border-b border-[var(--border)]">
          <div className="flex justify-between mb-2.5">
            <div>
              <span className="text-[24px] font-[800] text-[var(--text-main)] mr-2">이현수</span>
              <span className="inline-flex items-center text-[12px] font-bold text-[var(--primary)] bg-[var(--primary-bg)] border border-[var(--primary)] px-2 py-1 rounded-[4px]">
                작업자
              </span>
            </div>
            <button
              onClick={onClose}
              className="border border-[var(--border)] bg-transparent rounded-lg px-3.5 py-1.5 text-[14px] text-[var(--text-sub)] active:bg-[var(--bg-body)]"
            >
              닫기
            </button>
          </div>
          <div className="text-[15px] text-[var(--text-sub)]">manager@inopnc.com</div>
        </div>

        {/* Navigation Links */}
        <ul className="flex-1 overflow-y-auto p-6 m-0 list-none space-y-6">
          <li>
            <button
              onClick={onClose}
              className="text-[20px] font-bold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors w-full text-left"
            >
              홈
            </button>
          </li>
          <li>
            <button className="text-[20px] font-bold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors w-full text-left">
              현장정보
            </button>
          </li>
          <li>
            <button className="text-[20px] font-bold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors w-full text-left">
              작업일지
            </button>
          </li>
          <li>
            <button className="text-[20px] font-bold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors w-full text-left">
              출력현황
            </button>
          </li>
          <li>
            <button
              onClick={onClose}
              className="text-[20px] font-bold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors w-full text-left"
            >
              문서함
            </button>
          </li>
          <li className="flex justify-between items-center pt-2">
            <span className="text-[20px] font-bold text-[var(--text-main)]">내정보</span>
            <button
              onClick={() => {
                onClose()
                onOpenAccount()
              }}
              className="text-[15px] font-bold text-[var(--primary)] bg-[var(--bg-surface)] border border-[var(--primary)] px-3.5 py-2 rounded-lg active:opacity-80 transition-opacity"
            >
              계정관리
            </button>
          </li>
        </ul>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[var(--border)]">
          <button
            onClick={() => alert('로그아웃')}
            className="w-full h-[56px] bg-[var(--navy-btn)] text-white border-none rounded-xl text-[17px] font-bold active:opacity-90 transition-opacity"
          >
            로그아웃
          </button>
        </div>
      </div>
    </>
  )
}
