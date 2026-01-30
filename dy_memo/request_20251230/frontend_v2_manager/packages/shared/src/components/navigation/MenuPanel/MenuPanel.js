import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useEffect, useState } from 'react'
export const MenuPanel = ({ isOpen, onClose, onOpenAccount }) => {
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
        className: `fixed top-0 bottom-0 left-0 w-[85%] max-w-[320px] bg-white dark:bg-[#1e293b] z-[2500] flex flex-col transition-transform duration-300 shadow-2xl ${isVisible ? 'translate-x-0' : '-translate-x-full'}`,
        children: [
          _jsxs('div', {
            className: 'p-6 pb-8 border-b border-[#e2e8f0] dark:border-[#334155]',
            children: [
              _jsxs('div', {
                className: 'flex justify-between mb-2.5',
                children: [
                  _jsxs('div', {
                    children: [
                      _jsx('span', {
                        className: 'text-[24px] font-[800] text-[#111111] dark:text-white mr-2',
                        children: '\uC774\uD604\uC218',
                      }),
                      _jsx('span', {
                        className:
                          'text-[12px] font-bold text-[#31a3fa] bg-[#eaf6ff] dark:bg-[#1e293b] dark:border dark:border-[#31a3fa] px-2 py-1 rounded-[4px] align-top',
                        children: '\uC791\uC5C5\uC790',
                      }),
                    ],
                  }),
                  _jsx('button', {
                    onClick: onClose,
                    className:
                      'border border-[#e2e8f0] dark:border-[#475569] bg-transparent rounded-lg px-3.5 py-1.5 text-[14px] text-[#475569] dark:text-[#94a3b8] active:bg-gray-50 dark:active:bg-[#334155]',
                    children: '\uB2EB\uAE30',
                  }),
                ],
              }),
              _jsx('div', {
                className: 'text-[15px] text-[#475569] dark:text-[#94a3b8]',
                children: 'manager@inopnc.com',
              }),
            ],
          }),
          _jsxs('ul', {
            className: 'flex-1 overflow-y-auto p-6 m-0 list-none space-y-6',
            children: [
              _jsx('li', {
                children: _jsx('button', {
                  onClick: onClose,
                  className:
                    'text-[20px] font-bold text-[#111111] dark:text-white hover:text-[#31a3fa] transition-colors w-full text-left',
                  children: '\uD648',
                }),
              }),
              _jsx('li', {
                children: _jsx('button', {
                  className:
                    'text-[20px] font-bold text-[#111111] dark:text-white hover:text-[#31a3fa] transition-colors w-full text-left',
                  children: '\uCD9C\uB825\uD604\uD669',
                }),
              }),
              _jsx('li', {
                children: _jsx('button', {
                  className:
                    'text-[20px] font-bold text-[#111111] dark:text-white hover:text-[#31a3fa] transition-colors w-full text-left',
                  children: '\uC791\uC5C5\uC77C\uC9C0',
                }),
              }),
              _jsx('li', {
                children: _jsx('button', {
                  className:
                    'text-[20px] font-bold text-[#111111] dark:text-white hover:text-[#31a3fa] transition-colors w-full text-left',
                  children: '\uD604\uC7A5\uC815\uBCF4',
                }),
              }),
              _jsx('li', {
                children: _jsx('button', {
                  onClick: onClose,
                  className:
                    'text-[20px] font-bold text-[#111111] dark:text-white hover:text-[#31a3fa] transition-colors w-full text-left',
                  children: '\uBB38\uC11C\uD568',
                }),
              }),
              _jsxs('li', {
                className: 'flex justify-between items-center pt-2',
                children: [
                  _jsx('span', {
                    className: 'text-[20px] font-bold text-[#111111] dark:text-white',
                    children: '\uB0B4\uC815\uBCF4',
                  }),
                  _jsx('button', {
                    onClick: () => {
                      onClose()
                      onOpenAccount()
                    },
                    className:
                      'text-[15px] font-bold text-[#31a3fa] bg-white dark:bg-[#1e293b] border border-[#31a3fa] px-3.5 py-2 rounded-lg active:opacity-80 transition-opacity',
                    children: '\uACC4\uC815\uAD00\uB9AC',
                  }),
                ],
              }),
            ],
          }),
          _jsx('div', {
            className: 'p-6 border-t border-[#e2e8f0] dark:border-[#334155]',
            children: _jsx('button', {
              onClick: () => alert('로그아웃'),
              className:
                'w-full h-[56px] bg-[#1a254f] dark:bg-[#3b82f6] text-white border-none rounded-xl text-[17px] font-bold active:opacity-90 transition-opacity',
              children: '\uB85C\uADF8\uC544\uC6C3',
            }),
          }),
        ],
      }),
    ],
  })
}
