import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, RotateCcw, Download, Share2, ZoomIn, ZoomOut, Move } from 'lucide-react'
import SignaturePad from 'signature_pad'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
const WorkReportModal = ({ isOpen, onClose, siteName, manpowerList, workSets, materials }) => {
  const canvasRef = useRef(null)
  const signaturePadRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [formKey, setFormKey] = useState(0) // For resetting uncontrolled inputs
  // Generate dynamic content strings
  const workerString = manpowerList
    .filter(m => m.worker && m.workHours > 0)
    .map(m => `${m.worker}(${m.workHours})`)
    .join(', ')
  const workContentString = workSets
    .map((ws, i) => {
      const loc = `${ws.location.block ? ws.location.block + '블럭 ' : ''}${ws.location.dong ? ws.location.dong + '동 ' : ''}${ws.location.floor ? ws.location.floor + '층' : ''}`
      const mem = ws.member === '기타' ? ws.customMemberValue : ws.member
      const proc = ws.process === '기타' ? ws.customProcessValue : ws.process
      return `${i + 1}. [${loc}] ${mem} - ${proc}`
    })
    .join('\n')
  const materialString = materials.map(m => `${m.name}: ${m.qty}말`).join(', ')
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current
      // Handle resizing
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        minWidth: 0.5,
        maxWidth: 2.5,
      })
    }
  }, [isOpen, formKey])
  const handleClear = () => signaturePadRef.current?.clear()
  const handleReset = () => {
    if (confirm('작성 내용을 초기화하시겠습니까?')) {
      setFormKey(prev => prev + 1)
    }
  }
  const handleShare = async () => {
    const element = document.getElementById('wr-document-area')
    if (!element) return
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      canvas.toBlob(
        async blob => {
          if (blob) {
            const file = new File([blob], `work_report_${Date.now()}.jpg`, { type: 'image/jpeg' })
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: '작업완료확인서',
                text: `${siteName} 작업완료확인서입니다.`,
              })
            } else {
              alert('이 브라우저에서는 파일 공유를 지원하지 않습니다.')
            }
          }
        },
        'image/jpeg',
        0.95
      )
    } catch (e) {
      console.error(e)
      alert('공유 준비 중 오류가 발생했습니다.')
    }
  }
  const handleDownload = async () => {
    const element = document.getElementById('wr-document-area')
    if (!element) return
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = 210
      const imgHeight = (canvas.height * pageWidth) / canvas.width
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight)
      pdf.save('WorkReport.pdf')
    } catch (e) {
      console.error(e)
      alert('PDF Creation Failed')
    }
  }
  if (!isOpen) return null
  return _jsxs('div', {
    className: 'fixed inset-0 bg-[#1e1e1e] z-50 flex flex-col text-white',
    children: [
      _jsxs('header', {
        className:
          'h-[60px] bg-black border-b border-[#333] flex items-center justify-between px-4 shrink-0',
        children: [
          _jsx('button', { onClick: onClose, children: _jsx(ChevronLeft, { size: 28 }) }),
          _jsx('span', {
            className: 'text-lg font-bold',
            children: '\uC791\uC5C5\uC644\uB8CC\uD655\uC778\uC11C',
          }),
          _jsxs('div', {
            className: 'flex gap-4',
            children: [
              _jsx('button', { onClick: handleReset, children: _jsx(RotateCcw, {}) }),
              _jsx('button', { onClick: handleDownload, children: _jsx(Download, {}) }),
            ],
          }),
        ],
      }),
      _jsx('div', {
        className: 'flex-1 overflow-auto bg-[#1e1e1e] flex justify-center pt-5 pb-20',
        children: _jsx('div', {
          style: { transform: `scale(${zoom})`, transformOrigin: 'top center' },
          className: 'transition-transform duration-100',
          children: _jsxs(
            'div',
            {
              id: 'wr-document-area',
              className:
                'w-[210mm] min-h-[297mm] bg-white text-black p-[15mm] shadow-2xl flex flex-col box-border',
              children: [
                _jsx('header', {
                  className: 'text-center mb-8 border-b-4 border-double border-black pb-4',
                  children: _jsx('h1', {
                    className: 'text-4xl font-black tracking-[5px]',
                    children: '\uC791 \uC5C5 \uC644 \uB8CC \uD655 \uC778 \uC11C',
                  }),
                }),
                _jsx('table', {
                  className: 'w-full border-collapse border-2 border-slate-800 mb-5',
                  children: _jsxs('tbody', {
                    children: [
                      _jsxs('tr', {
                        children: [
                          _jsx('th', {
                            className:
                              'border border-slate-800 p-2 bg-slate-50 w-[16%] text-slate-700 font-extrabold',
                            children: '\uD604 \uC7A5 \uBA85',
                          }),
                          _jsx('td', {
                            className: 'border border-slate-800 p-2',
                            children: _jsx('input', {
                              className: 'w-full outline-none font-semibold',
                              defaultValue: siteName,
                              placeholder: '\uB0B4\uC6A9 \uC785\uB825',
                            }),
                          }),
                          _jsx('th', {
                            className:
                              'border border-slate-800 p-2 bg-slate-50 w-[16%] text-slate-700 font-extrabold',
                            children: '\uACF5 \uC0AC \uBA85',
                          }),
                          _jsx('td', {
                            className: 'border border-slate-800 p-2',
                            children: _jsx('input', {
                              className: 'w-full outline-none font-semibold',
                              placeholder: '\uACF5\uC0AC\uBA85 \uC785\uB825',
                              defaultValue: '\uADE0\uC5F4\uBCF4\uC218 \uACF5\uC0AC',
                            }),
                          }),
                        ],
                      }),
                      _jsxs('tr', {
                        children: [
                          _jsx('th', {
                            className:
                              'border border-slate-800 p-2 bg-slate-50 w-[16%] text-slate-700 font-extrabold',
                            children: '\uC791 \uC5C5 \uC790',
                          }),
                          _jsx('td', {
                            className: 'border border-slate-800 p-2',
                            children: _jsx('textarea', {
                              className:
                                'w-full h-full outline-none font-semibold resize-none overflow-hidden',
                              rows: 2,
                              defaultValue: workerString,
                              placeholder: '\uC131\uBA85 \uC785\uB825',
                            }),
                          }),
                          _jsx('th', {
                            className:
                              'border border-slate-800 p-2 bg-slate-50 w-[16%] text-slate-700 font-extrabold',
                            children: '\uC791\uC5C5\uC77C\uC790',
                          }),
                          _jsx('td', {
                            className: 'border border-slate-800 p-2',
                            children: _jsx('input', {
                              className: 'w-full outline-none font-semibold',
                              defaultValue: new Date().toISOString().slice(0, 10),
                            }),
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
                _jsxs('div', {
                  className: 'border-2 border-slate-800 p-4 mb-5 flex flex-col h-[280px]',
                  children: [
                    _jsx('div', {
                      className:
                        'text-lg font-extrabold text-slate-800 mb-3 border-l-[5px] border-slate-600 pl-3',
                      children: '\uC791\uC5C5\uB0B4\uC6A9',
                    }),
                    _jsx('textarea', {
                      className:
                        'flex-1 w-full resize-none outline-none font-semibold leading-relaxed',
                      defaultValue: workContentString,
                      placeholder: '\uC0C1\uC138 \uB0B4\uC6A9 \uC785\uB825...',
                    }),
                    materialString &&
                      _jsxs('div', {
                        className: 'mt-2 pt-2 border-t border-dashed border-slate-300',
                        children: [
                          _jsx('span', {
                            className: 'font-bold text-slate-600 mr-2',
                            children: '\uC0AC\uC6A9\uC790\uC7AC:',
                          }),
                          _jsx('span', { className: 'font-semibold', children: materialString }),
                        ],
                      }),
                  ],
                }),
                _jsxs('div', {
                  className: 'border-2 border-slate-800 p-4 mb-5 flex flex-col h-[100px]',
                  children: [
                    _jsx('div', {
                      className:
                        'text-lg font-extrabold text-slate-800 mb-3 border-l-[5px] border-slate-600 pl-3',
                      children: '\uD2B9\uAE30\uC0AC\uD56D',
                    }),
                    _jsx('textarea', {
                      className: 'flex-1 w-full resize-none outline-none font-semibold',
                      placeholder: '\uD2B9\uC774\uC0AC\uD56D...',
                    }),
                  ],
                }),
                _jsxs('div', {
                  className: 'mt-4 text-center',
                  children: [
                    _jsx('div', {
                      className: 'text-xl font-extrabold mb-6',
                      children:
                        '\uC0C1\uAE30 \uC0AC\uD56D\uACFC \uAC19\uC774 \uC791\uC5C5\uC744 \uC644\uB8CC\uD558\uC600\uC74C\uC744 \uD655\uC778\uD569\uB2C8\uB2E4.',
                    }),
                    _jsx('div', {
                      className: 'text-xl font-extrabold mb-8 text-center',
                      children: new Date().toLocaleDateString(),
                    }),
                    _jsxs('div', {
                      className: 'grid grid-cols-[33%_27%_40%] border-2 border-slate-800 mb-5',
                      children: [
                        _jsxs('div', {
                          className:
                            'bg-slate-50 border-r border-slate-800 flex flex-col justify-center items-center p-3 gap-2',
                          children: [
                            _jsx('span', {
                              className: 'font-extrabold text-lg text-slate-700',
                              children: '\uC18C \uC18D :',
                            }),
                            _jsx('input', {
                              className:
                                'text-center text-lg font-bold w-full border-b border-dashed border-slate-300 bg-transparent',
                              defaultValue: '(\uC8FC)\uC774\uB178\uD53C\uC564\uC528',
                            }),
                          ],
                        }),
                        _jsxs('div', {
                          className:
                            'bg-slate-50 border-r border-slate-800 flex flex-col justify-center items-center p-3 gap-2',
                          children: [
                            _jsx('span', {
                              className: 'font-extrabold text-lg text-slate-700',
                              children: '\uC131 \uBA85 :',
                            }),
                            _jsx('input', {
                              className:
                                'text-center text-lg font-bold w-full border-b border-dashed border-slate-300 bg-transparent',
                              placeholder: '\uC791\uC5C5\uBC18\uC7A5',
                              defaultValue: manpowerList[0]?.worker || '',
                            }),
                          ],
                        }),
                        _jsxs('div', {
                          className: 'relative bg-white h-[200px] flex flex-col',
                          children: [
                            _jsx('div', {
                              className:
                                'p-2 text-sm font-bold text-slate-500 border-b border-dashed border-slate-200',
                              children: '\uD655\uC778\uC790 (\uC11C\uBA85)',
                            }),
                            _jsx('div', {
                              className: 'flex-1 relative',
                              children: _jsx('canvas', {
                                ref: canvasRef,
                                className: 'w-full h-full cursor-crosshair touch-none',
                              }),
                            }),
                            _jsx('div', {
                              className:
                                'h-11 bg-slate-50 border-t border-slate-200 flex justify-between items-center px-2',
                              children: _jsx('button', {
                                onClick: handleClear,
                                className:
                                  'text-xs px-3 py-1 bg-white border border-slate-300 rounded text-slate-600 font-semibold shadow-sm',
                                children: '\uC9C0\uC6B0\uAE30',
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            },
            formKey
          ),
        }),
      }),
      _jsxs('div', {
        className:
          'fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/80 px-8 py-3 rounded-full flex gap-8 backdrop-blur shadow-2xl z-50',
        children: [
          _jsxs('button', {
            onClick: () => setZoom(z => Math.max(0.5, z - 0.1)),
            className:
              'flex flex-col items-center gap-1 text-[11px] text-white/70 hover:text-white',
            children: [_jsx(ZoomOut, { size: 20 }), '\uCD95\uC18C'],
          }),
          _jsxs('button', {
            onClick: () => {},
            className:
              'flex flex-col items-center gap-1 text-[11px] text-white/70 hover:text-white',
            children: [_jsx(Move, { size: 20 }), '\uC774\uB3D9'],
          }),
          _jsxs('button', {
            onClick: () => setZoom(z => z + 0.1),
            className:
              'flex flex-col items-center gap-1 text-[11px] text-white/70 hover:text-white',
            children: [_jsx(ZoomIn, { size: 20 }), '\uD655\uB300'],
          }),
          _jsxs('button', {
            onClick: handleShare,
            className:
              'flex flex-col items-center gap-1 text-[11px] text-white/70 hover:text-white',
            children: [_jsx(Share2, { size: 20 }), '\uACF5\uC720'],
          }),
        ],
      }),
    ],
  })
}
export default WorkReportModal
