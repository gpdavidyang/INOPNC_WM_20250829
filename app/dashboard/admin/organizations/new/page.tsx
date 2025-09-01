'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import OrganizationForm from '@/components/admin/organizations/OrganizationForm'

export default function NewOrganizationPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로 가기
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          소속업체 등록
        </h1>
        
        <OrganizationForm
          organization={null}
          onClose={() => router.push('/dashboard/admin/organizations')}
          onSave={() => router.push('/dashboard/admin/organizations')}
          isPage={true}
        />
      </div>
    </div>
  )
}