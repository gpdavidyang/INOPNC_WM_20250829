'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Calendar, Building2 } from 'lucide-react'
import PhotoGridCreator from './PhotoGridCreator'
import PhotoGridList from './PhotoGridList'
import { useToast } from '@/components/ui/use-toast'

export default function PhotoGridToolMain() {
  const [view, setView] = useState<'list' | 'create'>('list')
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const { toast } = useToast()

  const handleCreate = () => {
    setSelectedDocument(null)
    setView('create')
  }

  const handleEdit = (document: any) => {
    setSelectedDocument(document)
    setView('create')
  }

  const handleBack = () => {
    setView('list')
    setSelectedDocument(null)
  }

  const handleSaveSuccess = () => {
    toast({
      title: '저장 완료',
      description: '사진대지 문서가 성공적으로 저장되었습니다.',
    })
    setView('list')
    setSelectedDocument(null)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {view === 'list' ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">사진대지 도구</h1>
              <p className="text-gray-600 mt-2">
                현장별 사진대지 문서를 생성하고 관리합니다
              </p>
            </div>
            <Button onClick={handleCreate} size="standard">
              <Plus className="mr-2 h-5 w-5" />
              새 문서 생성
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">전체 문서</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">이번 달 생성</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">활성 현장</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <PhotoGridList onEdit={handleEdit} />
        </>
      ) : (
        <PhotoGridCreator
          document={selectedDocument}
          onBack={handleBack}
          onSave={handleSaveSuccess}
        />
      )}
    </div>
  )
}