import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useEffect, useState } from 'react'
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'
export const NotificationPanel = ({ isOpen, onClose, notifications, onMarkAllRead }) => {
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
  return _jsxs(_Fragment, {
    children: [
      _jsx('div', {
        className: `fixed inset-0 z-[2000] bg-black/40 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`,
        onClick: onClose,
      }),
      _jsxs('div', {
        className: `fixed top-0 bottom-0 right-0 w-[85%] max-w-[320px] bg-white dark:bg-[#1e293b] z-[2500] flex flex-col transition-transform duration-300 shadow-2xl ${isVisible ? 'translate-x-0' : 'translate-x-full'}`,
        children: [
          _jsxs('div', {
            className:
              'h-[60px] flex items-center justify-between px-4 border-b border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] shrink-0',
            children: [
              _jsx('span', {
                className: 'text-[20px] font-bold text-[#1a254f] dark:text-white tracking-tight',
                children: '\uC54C\uB9BC \uC13C\uD130',
              }),
              _jsxs('div', {
                className: 'flex items-center gap-2',
                children: [
                  _jsx('button', {
                    onClick: onMarkAllRead,
                    className:
                      'px-3 py-1.5 rounded-lg border border-[#e2e8f0] dark:border-[#475569] bg-transparent text-[13px] text-[#475569] dark:text-[#94a3b8] font-bold hover:bg-gray-50 dark:hover:bg-[#334155] active:scale-95 transition-all',
                    children: '\uBAA8\uB450 \uC77D\uC74C',
                  }),
                  _jsx('button', {
                    onClick: onClose,
                    className: 'p-1 text-[#111111] dark:text-white active:opacity-60',
                    children: _jsx(X, { size: 24 }),
                  }),
                ],
              }),
            ],
          }),
          _jsx('ul', {
            className: 'flex-1 overflow-y-auto p-0 m-0 list-none',
            children:
              notifications.length === 0
                ? _jsx('li', {
                    className: 'p-5 text-center text-[#94a3b8] dark:text-[#64748b]',
                    children: '\uC54C\uB9BC\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
                  })
                : notifications.map(noti =>
                    _jsxs(
                      'li',
                      {
                        className: `p-5 border-b border-[#e2e8f0] dark:border-[#334155] flex gap-[14px] items-start transition-colors ${noti.unread ? 'bg-[#eaf6ff] dark:bg-[#1e293b]/50' : ''}`,
                        children: [
                          _jsxs('div', {
                            className: `w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                  ${
                    noti.type === 'alert'
                      ? 'bg-[#fff1f2] text-[#ef4444]'
                      : noti.type === 'info'
                        ? 'bg-[#eaf6ff] text-[#31a3fa]'
                        : 'bg-[#f8fafc] text-[#475569]'
                  }`,
                            children: [
                              noti.type === 'alert' && _jsx(AlertTriangle, { size: 20 }),
                              noti.type === 'info' && _jsx(Info, { size: 20 }),
                              noti.type === 'success' && _jsx(CheckCircle, { size: 20 }),
                            ],
                          }),
                          _jsxs('div', {
                            className: 'flex flex-col flex-1 gap-1',
                            children: [
                              _jsx('span', {
                                className: 'text-[17px] font-bold text-[#111111] dark:text-white',
                                children: noti.title,
                              }),
                              _jsx('span', {
                                className:
                                  'text-[15px] text-[#475569] dark:text-[#94a3b8] leading-[1.5]',
                                children: noti.desc,
                              }),
                              _jsx('span', {
                                className: 'text-[13px] text-[#94a3b8] dark:text-[#64748b] mt-1',
                                children: noti.time,
                              }),
                            ],
                          }),
                        ],
                      },
                      noti.id
                    )
                  ),
          }),
        ],
      }),
    ],
  })
}
