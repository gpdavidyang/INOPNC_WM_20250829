'use client'

import React, { useState, useRef } from 'react'
import { Profile } from '@/types'
import { Upload, Eye, Trash2, Plus, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DocumentsTabRedesignedProps {
  profile: Profile
}

interface RequiredDocument {
  id: string
  title: string
  hasFile: boolean
  isSelected: boolean
  fileUrl?: string
}

export default function DocumentsTabRedesigned({ profile }: DocumentsTabRedesignedProps) {
  const [activeTab, setActiveTab] = useState<'mine' | 'shared'>('mine')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null)
  
  // 필수 서류 목록
  const [documents, setDocuments] = useState<RequiredDocument[]>([
    { id: 'A', title: '배치전 검진', hasFile: true, isSelected: true },
    { id: 'B', title: '기초안전보건교육', hasFile: false, isSelected: false },
    { id: 'C', title: '차량보험증', hasFile: false, isSelected: false },
    { id: 'D', title: '차량등록증', hasFile: false, isSelected: false },
    { id: 'E', title: '통장사본', hasFile: false, isSelected: false },
    { id: 'F', title: '고령자 적합 직무 확인서', hasFile: false, isSelected: false }
  ])

  const handleDocumentToggle = (id: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, isSelected: !doc.isSelected } : doc
    ))
  }

  const handleUpload = async (docId: string) => {
    setUploadingDocId(docId)
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !uploadingDocId) return

    try {
      const supabase = createClient()
      
      // 파일 업로드 로직
      const fileName = `${profile.id}/${uploadingDocId}_${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(fileName, file)

      if (error) throw error

      // 문서 상태 업데이트
      setDocuments(prev => prev.map(doc => 
        doc.id === uploadingDocId 
          ? { ...doc, hasFile: true, fileUrl: data.path } 
          : doc
      ))

      // 입력 초기화
      setUploadingDocId(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('파일 업로드에 실패했습니다.')
    }
  }

  const handlePreview = (docId: string) => {
    const doc = documents.find(d => d.id === docId)
    if (doc?.fileUrl) {
      // 파일 미리보기 로직
      window.open(`/api/documents/preview/${doc.fileUrl}`, '_blank')
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('이 문서를 삭제하시겠습니까?')) return
    
    setDocuments(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, hasFile: false, fileUrl: undefined } : doc
    ))
  }

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full max-w-[480px] mx-auto px-4">
      {/* 탭 네비게이션 */}
      <div className="flex justify-center items-center mb-3">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1" role="tablist">
          <button
            className={`px-6 py-2 rounded-md font-semibold text-sm transition-all ${
              activeTab === 'mine' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('mine')}
            role="tab"
            aria-selected={activeTab === 'mine'}
          >
            내 문서함
          </button>
          <button
            className={`px-6 py-2 rounded-md font-semibold text-sm transition-all ${
              activeTab === 'shared' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            onClick={() => setActiveTab('shared')}
            role="tab"
            aria-selected={activeTab === 'shared'}
          >
            공유 문서함
          </button>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-5 py-3">
              <Search className="w-4 h-4 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="문서명 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
            </div>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium text-sm"
            >
              취소
            </button>
          )}
        </div>
      </div>

      {/* 문서 목록 */}
      {activeTab === 'mine' && (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border ${
                doc.isSelected 
                  ? 'border-blue-500 dark:border-blue-400' 
                  : 'border-gray-200 dark:border-gray-700'
              } p-4 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <button
                    onClick={() => handleDocumentToggle(doc.id)}
                    className="mr-3"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      doc.isSelected 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}>
                      {doc.isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {doc.title}
                    </h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!doc.hasFile ? (
                    <button
                      onClick={() => handleUpload(doc.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      업로드
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handlePreview(doc.id)}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        보기
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 추가 업로드 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="font-medium text-gray-600 dark:text-gray-400">
              추가 업로드
            </span>
          </button>
        </div>
      )}

      {activeTab === 'shared' && (
        <div className="py-16 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            공유된 문서가 없습니다
          </p>
        </div>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />
    </div>
  )
}