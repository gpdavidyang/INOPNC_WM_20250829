import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { useEffect, useState } from 'react'
import { ArrowLeft, Camera } from 'lucide-react'
export const AccountOverlay = ({ isOpen, onClose }) => {
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
    input.onchange = e => {
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
  return _jsxs('div', {
    className: `fixed inset-0 z-[2000] flex flex-col bg-[#f2f4f6] dark:bg-[#0f172a] transition-transform duration-300 cubic-bezier(0.33, 1, 0.68, 1) ${isVisible ? 'translate-y-0' : 'translate-y-full'}`,
    children: [
      _jsxs('div', {
        className:
          'h-[60px] px-4 flex items-center justify-between bg-white dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155] shrink-0',
        children: [
          _jsx('button', {
            onClick: onClose,
            className: 'p-1 bg-transparent border-none text-[#111111] dark:text-white',
            children: _jsx(ArrowLeft, { size: 24 }),
          }),
          _jsx('span', {
            className: 'text-[20px] font-bold text-[#111111] dark:text-white',
            children: '\uACC4\uC815 \uAD00\uB9AC',
          }),
          _jsx('button', {
            onClick: handleSave,
            className:
              'text-[17px] font-bold text-[#31a3fa] bg-transparent border-none p-0 cursor-pointer',
            children: '\uC800\uC7A5',
          }),
        ],
      }),
      _jsxs('div', {
        className: 'flex-1 p-5 overflow-y-auto pb-20',
        children: [
          _jsx('div', {
            className: 'flex flex-col items-center mb-8',
            children: _jsxs('div', {
              id: 'profile-preview',
              className:
                'w-[100px] h-[100px] rounded-full bg-[#e2e8f0] relative flex items-center justify-center text-[36px] font-bold text-[#94a3b8] border-4 border-white dark:border-[#1e293b] shadow-md bg-cover bg-center',
              children: [
                _jsx('span', { id: 'profile-letter', children: '\uC774' }),
                _jsx('button', {
                  onClick: handleProfileUpload,
                  className:
                    'absolute bottom-0 right-0 w-[34px] h-[34px] rounded-full bg-[#1a254f] dark:bg-[#31a3fa] text-white border-[3px] border-white dark:border-[#1e293b] flex items-center justify-center shadow-sm cursor-pointer',
                  children: _jsx(Camera, { size: 16 }),
                }),
              ],
            }),
          }),
          _jsxs('div', {
            className: 'mb-8',
            children: [
              _jsx('span', {
                className: 'block text-[15px] font-bold text-[#475569] dark:text-[#94a3b8] mb-3',
                children: '\uAE30\uBCF8 \uC815\uBCF4',
              }),
              _jsxs('div', {
                className: 'mb-4',
                children: [
                  _jsx('label', {
                    className:
                      'block text-[17px] font-bold text-[#475569] dark:text-[#94a3b8] mb-1.5',
                    children: '\uC774\uB984',
                  }),
                  _jsx('input', {
                    type: 'text',
                    defaultValue: '\uC774\uD604\uC218',
                    className:
                      'w-full h-[48px] px-3.5 border border-[#e2e8f0] dark:border-[#334155] rounded-xl text-[17px] text-[#111111] dark:text-white bg-white dark:bg-[#0f172a] font-medium outline-none focus:border-[#31a3fa]',
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'mb-4',
                children: [
                  _jsx('label', {
                    className:
                      'block text-[17px] font-bold text-[#475569] dark:text-[#94a3b8] mb-1.5',
                    children: '\uC774\uBA54\uC77C',
                  }),
                  _jsx('input', {
                    type: 'email',
                    defaultValue: 'manager@inopnc.com',
                    disabled: true,
                    className:
                      'w-full h-[48px] px-3.5 border border-[#e2e8f0] dark:border-[#334155] rounded-xl text-[17px] text-[#111111] dark:text-white bg-white dark:bg-[#0f172a] font-medium opacity-70',
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'mb-4',
                children: [
                  _jsx('label', {
                    className:
                      'block text-[17px] font-bold text-[#475569] dark:text-[#94a3b8] mb-1.5',
                    children: '\uC804\uD654\uBC88\uD638',
                  }),
                  _jsx('input', {
                    type: 'tel',
                    defaultValue: '010-1234-5678',
                    className:
                      'w-full h-[48px] px-3.5 border border-[#e2e8f0] dark:border-[#334155] rounded-xl text-[17px] text-[#111111] dark:text-white bg-white dark:bg-[#0f172a] font-medium outline-none focus:border-[#31a3fa]',
                  }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            className: 'mb-8',
            children: [
              _jsx('span', {
                className: 'block text-[15px] font-bold text-[#475569] dark:text-[#94a3b8] mb-3',
                children: '\uBCF4\uC548 \uC124\uC815',
              }),
              _jsxs('div', {
                className: 'mb-4',
                children: [
                  _jsx('label', {
                    className:
                      'block text-[17px] font-bold text-[#475569] dark:text-[#94a3b8] mb-1.5',
                    children: '\uBE44\uBC00\uBC88\uD638 \uBCC0\uACBD',
                  }),
                  _jsx('input', {
                    type: 'password',
                    placeholder: '\uC0C8 \uBE44\uBC00\uBC88\uD638 \uC785\uB825',
                    className:
                      'w-full h-[48px] px-3.5 border border-[#e2e8f0] dark:border-[#334155] rounded-xl text-[17px] text-[#111111] dark:text-white bg-white dark:bg-[#0f172a] font-medium outline-none focus:border-[#31a3fa]',
                  }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            className: 'mb-8',
            children: [
              _jsx('span', {
                className: 'block text-[15px] font-bold text-[#475569] dark:text-[#94a3b8] mb-3',
                children: '\uC54C\uB9BC \uC124\uC815',
              }),
              _jsxs('div', {
                className:
                  'flex justify-between items-center py-4 border-b border-[#e2e8f0] dark:border-[#334155]',
                children: [
                  _jsx('span', {
                    className: 'text-[17px] text-[#111111] dark:text-white font-medium',
                    children: '\uD478\uC2DC \uC54C\uB9BC',
                  }),
                  _jsxs('label', {
                    className: 'relative inline-block w-[48px] h-[26px]',
                    children: [
                      _jsx('input', {
                        type: 'checkbox',
                        defaultChecked: true,
                        className: 'opacity-0 w-0 h-0 peer',
                      }),
                      _jsx('span', {
                        className:
                          "absolute cursor-pointer inset-0 bg-[#cbd5e1] rounded-[34px] transition-all duration-400 before:absolute before:content-[''] before:h-[20px] before:w-[20px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-400 peer-checked:bg-[#31a3fa] peer-checked:before:translate-x-[22px]",
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'flex justify-between items-center py-4',
                children: [
                  _jsx('span', {
                    className: 'text-[17px] text-[#111111] dark:text-white font-medium',
                    children: '\uC774\uBA54\uC77C \uC218\uC2E0',
                  }),
                  _jsxs('label', {
                    className: 'relative inline-block w-[48px] h-[26px]',
                    children: [
                      _jsx('input', { type: 'checkbox', className: 'opacity-0 w-0 h-0 peer' }),
                      _jsx('span', {
                        className:
                          "absolute cursor-pointer inset-0 bg-[#cbd5e1] rounded-[34px] transition-all duration-400 before:absolute before:content-[''] before:h-[20px] before:w-[20px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-400 peer-checked:bg-[#31a3fa] peer-checked:before:translate-x-[22px]",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            className: 'mb-8',
            children: [
              _jsx('span', {
                className: 'block text-[15px] font-bold text-[#475569] dark:text-[#94a3b8] mb-3',
                children: '\uAE30\uD0C0',
              }),
              _jsxs('div', {
                className: 'flex justify-between mb-5',
                children: [
                  _jsx('span', {
                    className: 'text-[14px] text-[#475569] dark:text-[#94a3b8]',
                    children: '\uC571 \uBC84\uC804',
                  }),
                  _jsx('span', {
                    className: 'text-[14px] text-[#111111] dark:text-white font-semibold',
                    children: 'v1.2.0',
                  }),
                ],
              }),
              _jsx('button', {
                onClick: () => alert('회원 탈퇴'),
                className:
                  'text-[15px] font-bold text-[#ef4444] bg-transparent border-none p-0 underline cursor-pointer',
                children: '\uD68C\uC6D0 \uD0C8\uD1F4',
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
