'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { Site } from '@/types'
import { AlertCircle, ArrowLeft, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { SharedDocumentsSection } from './form/SharedDocumentsSection'
import { AccommodationSection, BasicInfoSection, ManagerInfoSection } from './form/SiteFormSections'
import { useSiteForm } from './hooks/useSiteForm'

type Mode = 'create' | 'edit'

interface Props {
  mode: Mode
  siteId?: string
  initial?: Partial<Site> | null
  onSuccess?: (site?: Site) => void
}

export default function SiteForm({ mode, siteId, initial, onSuccess }: Props) {
  const router = useRouter()
  const {
    form,
    startDateTbd,
    endDateTbd,
    saving,
    error,
    organizations,
    orgLoading,
    setFieldValue,
    setStartDateTbd,
    setEndDateTbd,
    submit,
  } = useSiteForm(initial)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await submit(siteId)
    if (result && onSuccess) {
      onSuccess(result)
    }
  }

  return (
    <form
      className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500"
      onSubmit={handleSubmit}
    >
      {/* Form Header */}
      <div className="flex items-center justify-between sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md py-4 border-b border-gray-100 dark:border-gray-800 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">
              {mode === 'create' ? '신규 현장 등록' : '현장 정보 수정'}
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">현장 관리</p>
          </div>
        </div>
        <Button
          type="submit"
          disabled={saving}
          className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all"
        >
          {saving ? (
            '저장 중...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              저장하기
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-2xl border-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-bold">{error}</AlertDescription>
        </Alert>
      )}

      {/* Sections */}
      <div className="grid grid-cols-1 gap-8">
        <BasicInfoSection
          form={form}
          setFieldValue={setFieldValue}
          organizations={organizations}
          orgLoading={orgLoading}
          startDateTbd={startDateTbd}
          setStartDateTbd={setStartDateTbd}
          endDateTbd={endDateTbd}
          setEndDateTbd={setEndDateTbd}
        />

        <ManagerInfoSection form={form} setFieldValue={setFieldValue} />

        {mode === 'edit' && siteId && <SharedDocumentsSection siteId={siteId} />}

        <AccommodationSection form={form} setFieldValue={setFieldValue} />
      </div>

      {/* Bottom Action Bar (Optional mobile focus) */}
      <div className="flex md:hidden fixed bottom-6 left-4 right-4 z-30">
        <Button
          className="w-full h-14 rounded-2xl bg-blue-600 font-black text-lg shadow-xl"
          disabled={saving}
          type="submit"
        >
          {saving ? '저장 중...' : '현장 정보 저장'}
        </Button>
      </div>
    </form>
  )
}
