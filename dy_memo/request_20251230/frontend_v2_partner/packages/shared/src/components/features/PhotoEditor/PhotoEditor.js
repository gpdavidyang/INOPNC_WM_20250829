import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import React, { useState, useEffect } from 'react'
import {
  ChevronLeft,
  RotateCcw,
  Download,
  ImagePlus,
  Minus,
  Plus,
  Hand,
  Share2,
  Save,
} from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
const PhotoEditor = ({ isOpen, onClose, initialData, onUpdate, meta }) => {
  const [zoom, setZoom] = useState(0.7)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  // Ensure grid of 6
  const ensureGrid = data => {
    const rem = data.length % 6
    if (rem !== 0) {
      return [...data, ...Array(6 - rem).fill(null)]
    }
    return data.length === 0 ? Array(6).fill(null) : data
  }
  const [gridData, setGridData] = useState(ensureGrid(initialData))
  useEffect(() => {
    if (isOpen) {
      setGridData(ensureGrid(initialData))
    }
  }, [isOpen, initialData])
  const handleUpload = e => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      const newData = [...gridData]
      // Handle async reading
      const readers = newFiles.map(file => {
        return new Promise(resolve => {
          const reader = new FileReader()
          reader.onload = ev => {
            resolve({
              img: ev.target?.result,
              member: meta.member,
              process: meta.process,
              desc: '보수후',
            })
          }
          reader.readAsDataURL(file)
        })
      })
      Promise.all(readers).then(results => {
        setGridData(prev => {
          const clone = [...prev]
          results.forEach(item => {
            const idx = clone.findIndex(p => p === null)
            if (idx !== -1) clone[idx] = item
            else clone.push(item)
          })
          return ensureGrid(clone)
        })
      })
    }
  }
  const updatePhotoText = (index, field, value) => {
    setGridData(prev => {
      const next = [...prev]
      if (next[index]) {
        next[index] = { ...next[index], [field]: value }
      }
      return next
    })
  }
  const handleSaveToApp = () => {
    const cleanData = gridData.filter(p => p !== null)
    onUpdate(cleanData)
    onClose()
  }
  const savePDF = async () => {
    const wrapper = document.getElementById('pe-paper-wrapper')
    if (!wrapper) return
    const originalTransform = wrapper.style.transform
    wrapper.style.transform = 'scale(1)'
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pages = wrapper.querySelectorAll('.pe-page')
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage()
        const canvas = await html2canvas(pages[i], {
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
        })
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 0, 0, 210, 297)
      }
      pdf.save(`${meta.site || 'photo_log'}.pdf`)
    } catch (e) {
      console.error(e)
      alert('Error saving PDF')
    } finally {
      wrapper.style.transform = originalTransform
    }
  }
  const handleMouseDown = e => {
    if (!isPanning) return
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }
  const handleMouseMove = e => {
    if (!isPanning || !dragStart) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }
  const handleMouseUp = () => {
    setDragStart(null)
  }
  if (!isOpen) return null
  return _jsxs('div', {
    className: 'fixed inset-0 bg-[#121212] z-50 flex flex-col text-white',
    children: [
      _jsxs('header', {
        className:
          'h-14 bg-black border-b border-[#222] flex items-center justify-between px-3 shrink-0',
        children: [
          _jsxs('div', {
            className: 'flex items-center gap-2',
            children: [
              _jsx('button', { onClick: onClose, children: _jsx(ChevronLeft, {}) }),
              _jsx('span', {
                className: 'font-bold',
                children: '\uC2A4\uB9C8\uD2B8 \uC0AC\uC9C4\uB300\uC9C0',
              }),
            ],
          }),
          _jsxs('div', {
            className: 'flex gap-2',
            children: [
              _jsx('button', {
                onClick: () => setGridData(ensureGrid([])),
                className: 'p-2',
                children: _jsx(RotateCcw, { className: 'w-5 h-5' }),
              }),
              _jsx('button', {
                onClick: savePDF,
                className: 'p-2',
                children: _jsx(Download, { className: 'w-5 h-5' }),
              }),
              _jsxs('button', {
                onClick: handleSaveToApp,
                className:
                  'flex items-center gap-1 bg-primary px-3 py-1 rounded-lg text-sm font-bold ml-2',
                children: [_jsx(Save, { className: 'w-4 h-4' }), ' \uC800\uC7A5'],
              }),
            ],
          }),
        ],
      }),
      _jsx('div', {
        className: 'bg-[#1e1e1e] p-3 border-b border-[#2a2a2a] flex flex-col gap-2 shrink-0',
        children: _jsxs('div', {
          className: 'flex gap-2',
          children: [
            _jsx('input', {
              className: 'flex-1 bg-[#2c2c2c] border border-[#3a3a3a] rounded px-3 py-2 text-sm',
              defaultValue: meta.site,
              placeholder: '\uD604\uC7A5\uBA85',
            }),
            _jsx('input', {
              className: 'flex-1 bg-[#2c2c2c] border border-[#3a3a3a] rounded px-3 py-2 text-sm',
              defaultValue: meta.project,
              placeholder: '\uACF5\uC0AC\uBA85',
            }),
          ],
        }),
      }),
      _jsx('div', {
        className: `flex-1 relative overflow-hidden flex justify-center pt-8 pb-32 bg-[#121212] ${isPanning ? 'cursor-grab active:cursor-grabbing' : ''}`,
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
        onMouseLeave: handleMouseUp,
        children: _jsx('div', {
          id: 'pe-paper-wrapper',
          style: {
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top center',
            transition: isPanning ? 'none' : 'transform 0.1s',
          },
          className: 'flex flex-col gap-8 items-center pointer-events-none',
          children: Array.from({ length: Math.ceil(gridData.length / 6) }).map((_, pageIdx) =>
            _jsxs(
              'div',
              {
                className:
                  'pe-page w-[794px] h-[1123px] bg-white text-black p-10 shadow-xl flex flex-col box-border pointer-events-auto',
                children: [
                  _jsx('div', {
                    className: 'text-center mb-4',
                    children: _jsx('h1', {
                      className: 'text-3xl font-black',
                      children: meta.site || '공사 사진대지',
                    }),
                  }),
                  _jsx('table', {
                    className: 'w-full border-collapse border-2 border-[#333] table-fixed mb-0',
                    children: _jsx('tbody', {
                      children: _jsxs('tr', {
                        children: [
                          _jsx('td', {
                            className:
                              'border border-[#333] bg-slate-100 font-bold w-[15%] h-[30px] text-center',
                            children: '\uACF5\uC0AC\uBA85',
                          }),
                          _jsx('td', {
                            className: 'border border-[#333] pl-2',
                            children: meta.project,
                          }),
                        ],
                      }),
                    }),
                  }),
                  _jsxs('table', {
                    className:
                      'w-full border-collapse border-2 border-[#333] table-fixed mt-[-2px]',
                    children: [
                      _jsxs('colgroup', {
                        children: [
                          _jsx('col', { width: '15%' }),
                          _jsx('col', { width: '35%' }),
                          _jsx('col', { width: '15%' }),
                          _jsx('col', { width: '35%' }),
                        ],
                      }),
                      _jsx('tbody', {
                        children: [0, 1, 2].map(row => {
                          const idx1 = pageIdx * 6 + row * 2
                          const idx2 = idx1 + 1
                          const d1 = gridData[idx1]
                          const d2 = gridData[idx2]
                          return _jsxs(
                            React.Fragment,
                            {
                              children: [
                                _jsxs('tr', {
                                  className: 'h-[215px]',
                                  children: [
                                    _jsx('td', {
                                      colSpan: 2,
                                      className:
                                        'border border-[#333] p-0 relative bg-slate-50 cursor-pointer overflow-hidden',
                                      children: d1
                                        ? _jsx('img', {
                                            src: d1.img,
                                            className: 'w-full h-full object-cover',
                                          })
                                        : _jsx('div', {
                                            className:
                                              'absolute inset-0 flex items-center justify-center text-slate-300 text-4xl',
                                            children: '+',
                                          }),
                                    }),
                                    _jsx('td', {
                                      colSpan: 2,
                                      className:
                                        'border border-[#333] p-0 relative bg-slate-50 cursor-pointer overflow-hidden',
                                      children: d2
                                        ? _jsx('img', {
                                            src: d2.img,
                                            className: 'w-full h-full object-cover',
                                          })
                                        : _jsx('div', {
                                            className:
                                              'absolute inset-0 flex items-center justify-center text-slate-300 text-4xl',
                                            children: '+',
                                          }),
                                    }),
                                  ],
                                }),
                                _jsxs('tr', {
                                  children: [
                                    _jsx('td', {
                                      className:
                                        'border border-[#333] bg-slate-100 font-bold text-center h-8',
                                      children: '\uBD80\uC7AC\uBA85',
                                    }),
                                    _jsx('td', {
                                      className: 'border border-[#333]',
                                      children: _jsx('input', {
                                        className:
                                          'w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50',
                                        value: d1?.member || '',
                                        onChange: e =>
                                          updatePhotoText(idx1, 'member', e.target.value),
                                      }),
                                    }),
                                    _jsx('td', {
                                      className:
                                        'border border-[#333] bg-slate-100 font-bold text-center',
                                      children: '\uBD80\uC7AC\uBA85',
                                    }),
                                    _jsx('td', {
                                      className: 'border border-[#333]',
                                      children: _jsx('input', {
                                        className:
                                          'w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50',
                                        value: d2?.member || '',
                                        onChange: e =>
                                          updatePhotoText(idx2, 'member', e.target.value),
                                      }),
                                    }),
                                  ],
                                }),
                                _jsxs('tr', {
                                  children: [
                                    _jsx('td', {
                                      className:
                                        'border border-[#333] bg-slate-100 font-bold text-center h-8',
                                      children: '\uACF5 \uC815',
                                    }),
                                    _jsx('td', {
                                      className: 'border border-[#333]',
                                      children: _jsx('input', {
                                        className:
                                          'w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50',
                                        value: d1?.process || '',
                                        onChange: e =>
                                          updatePhotoText(idx1, 'process', e.target.value),
                                      }),
                                    }),
                                    _jsx('td', {
                                      className:
                                        'border border-[#333] bg-slate-100 font-bold text-center',
                                      children: '\uACF5 \uC815',
                                    }),
                                    _jsx('td', {
                                      className: 'border border-[#333]',
                                      children: _jsx('input', {
                                        className:
                                          'w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50',
                                        value: d2?.process || '',
                                        onChange: e =>
                                          updatePhotoText(idx2, 'process', e.target.value),
                                      }),
                                    }),
                                  ],
                                }),
                                _jsxs('tr', {
                                  children: [
                                    _jsx('td', {
                                      className:
                                        'border border-[#333] bg-slate-100 font-bold text-center h-8',
                                      children: '\uB0B4 \uC6A9',
                                    }),
                                    _jsx('td', {
                                      className:
                                        'border border-[#333] text-center font-semibold cursor-pointer',
                                      children: _jsx('input', {
                                        className:
                                          'w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50',
                                        value: d1?.desc || '',
                                        onChange: e =>
                                          updatePhotoText(idx1, 'desc', e.target.value),
                                      }),
                                    }),
                                    _jsx('td', {
                                      className:
                                        'border border-[#333] bg-slate-100 font-bold text-center',
                                      children: '\uB0B4 \uC6A9',
                                    }),
                                    _jsx('td', {
                                      className:
                                        'border border-[#333] text-center font-semibold cursor-pointer',
                                      children: _jsx('input', {
                                        className:
                                          'w-full h-full text-center border-none outline-none bg-transparent focus:bg-blue-50',
                                        value: d2?.desc || '',
                                        onChange: e =>
                                          updatePhotoText(idx2, 'desc', e.target.value),
                                      }),
                                    }),
                                  ],
                                }),
                              ],
                            },
                            row
                          )
                        }),
                      }),
                    ],
                  }),
                ],
              },
              pageIdx
            )
          ),
        }),
      }),
      _jsxs('div', {
        className:
          'fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#222] px-6 py-2 rounded-full flex gap-6 border border-[#333] shadow-2xl z-50',
        children: [
          _jsxs('label', {
            className:
              'flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white cursor-pointer',
            children: [
              _jsx(ImagePlus, { size: 20 }),
              _jsx('span', { children: '\uCD94\uAC00' }),
              _jsx('input', {
                type: 'file',
                multiple: true,
                accept: 'image/*',
                className: 'hidden',
                onChange: handleUpload,
              }),
            ],
          }),
          _jsx('div', { className: 'w-px h-6 bg-[#444] self-center' }),
          _jsxs('button', {
            onClick: () => setZoom(z => Math.max(0.2, z - 0.1)),
            className:
              'flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white',
            children: [_jsx(Minus, { size: 20 }), _jsx('span', { children: '\uCD95\uC18C' })],
          }),
          _jsxs('button', {
            onClick: () => setIsPanning(!isPanning),
            className: `flex flex-col items-center gap-1 text-[10px] ${isPanning ? 'text-primary' : 'text-white/70'} hover:text-white`,
            children: [_jsx(Hand, { size: 20 }), _jsx('span', { children: '\uC774\uB3D9' })],
          }),
          _jsxs('button', {
            onClick: () => setZoom(z => z + 0.1),
            className:
              'flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white',
            children: [_jsx(Plus, { size: 20 }), _jsx('span', { children: '\uD655\uB300' })],
          }),
          _jsxs('button', {
            onClick: () => {},
            className:
              'flex flex-col items-center gap-1 text-[10px] text-white/70 hover:text-white',
            children: [_jsx(Share2, { size: 20 }), _jsx('span', { children: '\uACF5\uC720' })],
          }),
        ],
      }),
    ],
  })
}
export default PhotoEditor
