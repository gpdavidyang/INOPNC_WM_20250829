'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PhotoGridCreatorProps {
  document?: any
  onBack: () => void
  onSave: () => void
}

interface PhotoData {
  before: File | null
  after: File | null
  beforePreview: string | null
  afterPreview: string | null
}

export default function PhotoGridCreator({ document, onBack, onSave }: PhotoGridCreatorProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState<any[]>([])
  
  // Form state
  const [selectedSite, setSelectedSite] = useState(document?.site_id || '')
  const [componentName, setComponentName] = useState(document?.component_name || '')
  const [customComponentName, setCustomComponentName] = useState('')
  const [workProcess, setWorkProcess] = useState(document?.work_process || '')
  const [customWorkProcess, setCustomWorkProcess] = useState('')
  const [workSection, setWorkSection] = useState(document?.work_section || '')
  const [workDate, setWorkDate] = useState(
    document?.work_date || format(new Date(), 'yyyy-MM-dd')
  )
  const [photos, setPhotos] = useState<PhotoData>({
    before: null,
    after: null,
    beforePreview: document?.before_photo_url || null,
    afterPreview: document?.after_photo_url || null,
  })

  // Component type options (부재명)
  const componentTypes = [
    '슬라브',
    '거더',
    '기둥',
    '기타',
  ]

  // Process type options (작업공정)
  const processTypes = [
    '균열',
    '면',
    '마감',
    '기타',
  ]

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites')
      if (response.ok) {
        const data = await response.json()
        setSites(Array.isArray(data) ? data : [])
      } else {
        setSites([])
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error)
      setSites([])
    }
  }

  const handlePhotoUpload = (type: 'before' | 'after', file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: '오류',
        description: '이미지 파일만 업로드할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotos(prev => ({
        ...prev,
        [type]: file,
        [`${type}Preview`]: reader.result as string,
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = (type: 'before' | 'after') => {
    setPhotos(prev => ({
      ...prev,
      [type]: null,
      [`${type}Preview`]: null,
    }))
  }

  const handleSave = async () => {
    // Validation
    if (!selectedSite) {
      toast({
        title: '오류',
        description: '현장을 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!componentName || !workProcess) {
      toast({
        title: '오류',
        description: '부재명과 작업공정을 선택해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (componentName === '기타' && !customComponentName) {
      toast({
        title: '오류',
        description: '부재명을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (workProcess === '기타' && !customWorkProcess) {
      toast({
        title: '오류',
        description: '작업공정을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!photos.before && !photos.beforePreview) {
      toast({
        title: '오류',
        description: '작업 전 사진을 업로드해주세요.',
        variant: 'destructive',
      })
      return
    }

    if (!photos.after && !photos.afterPreview) {
      toast({
        title: '오류',
        description: '작업 후 사진을 업로드해주세요.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('site_id', selectedSite)
      formData.append('component_name', componentName === '기타' ? customComponentName : componentName)
      formData.append('work_process', workProcess === '기타' ? customWorkProcess : workProcess)
      formData.append('work_section', workSection)
      formData.append('work_date', workDate)
      
      if (photos.before) {
        formData.append('before_photo', photos.before)
      }
      if (photos.after) {
        formData.append('after_photo', photos.after)
      }

      const url = document 
        ? `/api/photo-grids/${document.id}`
        : '/api/photo-grids'
      
      const method = document ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        body: formData,
      })

      if (response.ok) {
        onSave()
      } else {
        throw new Error('Failed to save document')
      }
    } catch (error) {
      console.error('Error saving document:', error)
      toast({
        title: '오류',
        description: '문서 저장에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로
        </Button>
        <h1 className="text-2xl font-bold">
          {document ? '사진대지 수정' : '새 사진대지 생성'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="site">현장 선택 *</Label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger id="site">
                  <SelectValue placeholder="현장을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="workDate">작업일자</Label>
              <Input
                id="workDate"
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="component">부재명 *</Label>
              <Select value={componentName} onValueChange={(value) => {
                setComponentName(value)
                if (value !== '기타') {
                  setCustomComponentName('')
                }
              }}>
                <SelectTrigger id="component">
                  <SelectValue placeholder="부재명을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {componentTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {componentName === '기타' && (
                <Input
                  className="mt-2"
                  placeholder="부재명을 입력하세요"
                  value={customComponentName}
                  onChange={(e) => setCustomComponentName(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label htmlFor="process">작업공정 *</Label>
              <Select value={workProcess} onValueChange={(value) => {
                setWorkProcess(value)
                if (value !== '기타') {
                  setCustomWorkProcess('')
                }
              }}>
                <SelectTrigger id="process">
                  <SelectValue placeholder="작업공정을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {processTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {workProcess === '기타' && (
                <Input
                  className="mt-2"
                  placeholder="작업공정을 입력하세요"
                  value={customWorkProcess}
                  onChange={(e) => setCustomWorkProcess(e.target.value)}
                />
              )}
            </div>

            <div>
              <Label htmlFor="section">작업구간</Label>
              <Input
                id="section"
                placeholder="예: 1층 A구역"
                value={workSection}
                onChange={(e) => setWorkSection(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Photos */}
        <Card>
          <CardHeader>
            <CardTitle>사진 업로드</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Before Photo */}
            <div>
              <Label>작업 전 사진 *</Label>
              {photos.beforePreview ? (
                <div className="relative mt-2">
                  <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={photos.beforePreview}
                      alt="작업 전"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemovePhoto('before')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="block mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handlePhotoUpload('before', file)
                    }}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      클릭하여 사진 업로드
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* After Photo */}
            <div>
              <Label>작업 후 사진 *</Label>
              {photos.afterPreview ? (
                <div className="relative mt-2">
                  <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={photos.afterPreview}
                      alt="작업 후"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemovePhoto('after')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="block mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handlePhotoUpload('after', file)
                    }}
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      클릭하여 사진 업로드
                    </p>
                  </div>
                </label>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={onBack}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}