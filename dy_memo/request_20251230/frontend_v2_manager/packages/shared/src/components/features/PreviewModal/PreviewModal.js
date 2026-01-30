import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { useState, useRef, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, Hand, Download, Share2 } from 'lucide-react'
const PreviewModal = ({ isOpen, onClose, title, type, src, details }) => {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isPanningMode, setIsPanningMode] = useState(false)
  const contentRef = useRef(null)
  useEffect(() => {
    if (isOpen) {
      // Default zoom: 0.6 for drawings (A3), 0.45 for photos (A4 portrait) to fit screens better
      setZoom(type === 'drawing' ? 0.6 : 0.45)
      setPosition({ x: 0, y: 0 })
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen, type])
  if (!isOpen) return null
  const handleZoom = delta => {
    setZoom(prev => Math.max(0.2, Math.min(prev + delta, 4)))
  }
  const handleMouseDown = e => {
    if (!isPanningMode) return
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragStart({ x: clientX - position.x, y: clientY - position.y })
  }
  const handleMouseMove = e => {
    if (!isDragging || !isPanningMode) return
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y })
  }
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  // Cursor style based on mode
  const cursorStyle = isPanningMode
    ? isDragging
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : 'cursor-default'
  return _jsxs('div', {
    className:
      'fixed inset-0 z-[9999] bg-[#121212] flex flex-col text-white font-sans overflow-hidden select-none',
    children: [
      _jsxs('header', {
        className:
          'h-14 bg-black/50 flex items-center justify-between px-3 border-b border-gray-800 z-50',
        children: [
          _jsx('button', {
            onClick: onClose,
            className: 'p-2 rounded-full hover:bg-gray-800 transition',
            children: _jsx(X, { className: 'w-6 h-6 text-white' }),
          }),
          _jsx('div', { className: 'text-[17px] font-bold truncate max-w-[60%]', children: title }),
          _jsx('button', {
            className: 'p-2 rounded-full hover:bg-gray-800 transition',
            children: _jsx(Download, { className: 'w-5 h-5 text-white' }),
          }),
        ],
      }),
      _jsx('div', {
        className: `flex-1 relative overflow-hidden flex items-center justify-center bg-[#121212] ${cursorStyle}`,
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseUp,
        onTouchStart: handleMouseDown,
        onTouchMove: handleMouseMove,
        onTouchEnd: handleMouseUp,
        children: _jsx('div', {
          ref: contentRef,
          style: {
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          },
          className: 'flex items-center justify-center p-10',
          children:
            type === 'drawing'
              ? // A3 Landscape Simulation
                _jsx('div', {
                  className: 'bg-white shadow-2xl relative',
                  style: { width: '842px', height: '595px', padding: '40px' },
                  children: _jsxs('div', {
                    className: 'border-4 border-black h-full flex flex-col relative',
                    children: [
                      _jsxs('div', {
                        className:
                          'absolute top-0 right-0 border-l-2 border-b-2 border-black p-2 bg-yellow-50 text-black text-xs font-bold',
                        children: ['A3 LANDSCAPE - ', title],
                      }),
                      _jsx('img', {
                        src: src,
                        className: 'w-full h-full object-contain',
                        alt: 'Drawing',
                      }),
                    ],
                  }),
                })
              : // @photoex A4 Portrait 2 Columns x 3 Rows Style
                _jsxs('div', {
                  className: 'bg-white shadow-2xl text-black flex flex-col box-border',
                  style: {
                    width: '794px', // A4 width @ 96dpi
                    height: '1123px', // A4 height @ 96dpi
                    padding: '40px',
                    backgroundColor: 'white',
                  },
                  children: [
                    _jsxs('div', {
                      className: 'mb-4 text-xl font-bold border-b-2 border-black pb-2 text-left',
                      children: ['\uACF5\uC0AC\uBA85: ', details?.site || '현장명 미지정'],
                    }),
                    _jsx('div', {
                      className:
                        'flex-1 border-t-2 border-l-2 border-black grid grid-cols-2 grid-rows-3',
                      children: [0, 1, 2, 3, 4, 5].map(index =>
                        _jsx(
                          'div',
                          {
                            className: 'border-r-2 border-b-2 border-black flex flex-col p-3',
                            children:
                              index === 0
                                ? _jsxs(_Fragment, {
                                    children: [
                                      _jsx('div', {
                                        className:
                                          'flex-1 flex items-center justify-center overflow-hidden bg-gray-50 mb-2 border border-gray-200',
                                        children: _jsx('img', {
                                          src: src,
                                          className: 'max-w-full max-h-full object-contain',
                                          alt: 'Work',
                                        }),
                                      }),
                                      _jsxs('div', {
                                        className: 'border border-black text-sm',
                                        children: [
                                          _jsxs('div', {
                                            className: 'flex border-b border-black',
                                            children: [
                                              _jsx('div', {
                                                className:
                                                  'w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold py-1',
                                                children: '\uBD80\uC7AC\uBA85',
                                              }),
                                              _jsx('div', {
                                                className:
                                                  'flex-1 flex items-center justify-center font-medium py-1',
                                                children: details?.member || '-',
                                              }),
                                            ],
                                          }),
                                          _jsxs('div', {
                                            className: 'flex border-b border-black',
                                            children: [
                                              _jsx('div', {
                                                className:
                                                  'w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold py-1',
                                                children: '\uACF5 \uC815',
                                              }),
                                              _jsx('div', {
                                                className:
                                                  'flex-1 flex items-center justify-center font-medium py-1',
                                                children: details?.process || '-',
                                              }),
                                            ],
                                          }),
                                          _jsxs('div', {
                                            className: 'flex',
                                            children: [
                                              _jsx('div', {
                                                className:
                                                  'w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold py-1',
                                                children: '\uB0B4 \uC6A9',
                                              }),
                                              _jsx('div', {
                                                className:
                                                  'flex-1 flex items-center justify-center font-medium py-1',
                                                children: details?.content || '보수후',
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  })
                                : _jsxs(_Fragment, {
                                    children: [
                                      _jsx('div', { className: 'flex-1 mb-2' }),
                                      _jsxs('div', {
                                        className: 'border border-black text-sm opacity-30',
                                        children: [
                                          _jsxs('div', {
                                            className: 'flex border-b border-black h-[29px]',
                                            children: [
                                              _jsx('div', {
                                                className:
                                                  'w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold',
                                                children: '\uBD80\uC7AC\uBA85',
                                              }),
                                              _jsx('div', { className: 'flex-1' }),
                                            ],
                                          }),
                                          _jsxs('div', {
                                            className: 'flex border-b border-black h-[29px]',
                                            children: [
                                              _jsx('div', {
                                                className:
                                                  'w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold',
                                                children: '\uACF5 \uC815',
                                              }),
                                              _jsx('div', { className: 'flex-1' }),
                                            ],
                                          }),
                                          _jsxs('div', {
                                            className: 'flex h-[29px]',
                                            children: [
                                              _jsx('div', {
                                                className:
                                                  'w-[80px] bg-gray-100 border-r border-black flex items-center justify-center font-bold',
                                                children: '\uB0B4 \uC6A9',
                                              }),
                                              _jsx('div', { className: 'flex-1' }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                          },
                          index
                        )
                      ),
                    }),
                  ],
                }),
        }),
      }),
      _jsxs('div', {
        className:
          'absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-[#222] border border-[#333] rounded-full px-6 py-2 flex items-center gap-6 shadow-2xl z-50',
        children: [
          _jsxs('button', {
            onClick: () => handleZoom(-0.2),
            className: 'flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition',
            children: [
              _jsx(ZoomOut, { className: 'w-5 h-5 text-white' }),
              _jsx('span', { className: 'text-[10px] font-medium', children: '\uCD95\uC18C' }),
            ],
          }),
          _jsxs('button', {
            onClick: () => setIsPanningMode(!isPanningMode),
            className: `flex flex-col items-center gap-1 transition ${isPanningMode ? 'text-primary opacity-100' : 'text-white opacity-70 hover:opacity-100'}`,
            children: [
              _jsx(Hand, { className: 'w-5 h-5' }),
              _jsx('span', { className: 'text-[10px] font-medium', children: '\uC774\uB3D9' }),
            ],
          }),
          _jsxs('button', {
            onClick: () => handleZoom(0.2),
            className: 'flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition',
            children: [
              _jsx(ZoomIn, { className: 'w-5 h-5 text-white' }),
              _jsx('span', { className: 'text-[10px] font-medium', children: '\uD655\uB300' }),
            ],
          }),
          _jsxs('button', {
            className: 'flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition',
            children: [
              _jsx(Share2, { className: 'w-5 h-5 text-white' }),
              _jsx('span', { className: 'text-[10px] font-medium', children: '\uACF5\uC720' }),
            ],
          }),
        ],
      }),
    ],
  })
}
export default PreviewModal
