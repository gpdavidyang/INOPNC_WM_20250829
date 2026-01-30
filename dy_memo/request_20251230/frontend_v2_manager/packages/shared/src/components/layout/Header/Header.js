import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { Search, Moon, Sun, FileCheck, Bell, Menu } from 'lucide-react'
export const Header = ({
  onSearchClick,
  title = 'INOPNC',
  isDarkMode,
  toggleTheme,
  onCertClick,
  unreadCount = 0,
  onNotificationClick,
  onMenuClick,
}) => {
  // Common button style - 폰트 가독성 개선
  const btnClass =
    'bg-transparent border-none p-1 flex flex-col items-center gap-[3px] cursor-pointer text-[#1a254f] dark:text-white active:opacity-60 hover:opacity-80 transition-all font-bold'
  return _jsx('header', {
    className:
      'fixed top-0 left-0 right-0 h-[60px] bg-white dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155] z-40 flex items-center justify-center transition-colors duration-300',
    children: _jsxs('div', {
      className: 'w-full max-w-[600px] px-5 flex justify-between items-center h-full',
      children: [
        _jsx('div', {
          className:
            'text-[24px] font-[800] text-[#1a254f] dark:text-white tracking-tighter cursor-pointer',
          onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
          children: title,
        }),
        _jsxs('div', {
          className: 'flex items-center gap-3',
          children: [
            _jsxs('button', {
              onClick: onSearchClick,
              className: btnClass,
              children: [
                _jsx(Search, { size: 20 }),
                _jsx('span', {
                  className: 'text-[13px] tracking-tight',
                  children: '\uD1B5\uD569\uAC80\uC0C9',
                }),
              ],
            }),
            _jsxs('button', {
              onClick: toggleTheme,
              className: btnClass,
              children: [
                isDarkMode ? _jsx(Sun, { size: 20 }) : _jsx(Moon, { size: 20 }),
                _jsx('span', {
                  className: 'text-[13px] tracking-tight',
                  children: isDarkMode ? '라이트' : '다크',
                }),
              ],
            }),
            _jsxs('button', {
              className: btnClass,
              onClick: onCertClick,
              children: [
                _jsx(FileCheck, { size: 20 }),
                _jsx('span', {
                  className: 'text-[13px] tracking-tight',
                  children: '\uD655\uC778\uC11C',
                }),
              ],
            }),
            _jsxs('button', {
              className: `${btnClass} relative`,
              onClick: onNotificationClick,
              children: [
                _jsxs('div', {
                  className: 'relative',
                  children: [
                    _jsx(Bell, { size: 20 }),
                    unreadCount > 0 &&
                      _jsx('span', {
                        className:
                          'absolute -top-1 -right-1 bg-[#ef4444] text-white text-[10px] font-black w-[16px] h-[16px] flex items-center justify-center rounded-full border border-white dark:border-[#1e293b] animate-bounce-in',
                        children: unreadCount > 9 ? '9+' : unreadCount,
                      }),
                  ],
                }),
                _jsx('span', { className: 'text-[13px] tracking-tight', children: '\uC54C\uB9BC' }),
              ],
            }),
            _jsxs('button', {
              className: btnClass,
              onClick: onMenuClick,
              children: [
                _jsx(Menu, { size: 20 }),
                _jsx('span', { className: 'text-[13px] tracking-tight', children: '\uBA54\uB274' }),
              ],
            }),
          ],
        }),
      ],
    }),
  })
}
