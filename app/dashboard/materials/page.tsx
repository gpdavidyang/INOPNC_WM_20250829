import { Suspense } from 'react'
import { MaterialManagement } from '@/components/materials/material-management'

export default async function MaterialsPage() {
  const profileResult = await getProfile()
  if (!profileResult.success || !profileResult.data) {
    redirect('/auth/login')
  }

  const [materialsResult, categoriesResult, siteResult] = await Promise.all([
    getMaterials(),
    getMaterialCategories(),
    getCurrentUserSite()
  ])

  const materials = materialsResult.success ? materialsResult.data || [] : []
  const categories = categoriesResult.success ? categoriesResult.data || [] : []

  // Get inventory for user's site if they have one
  let inventory: unknown[] = []
  if (siteResult.success && siteResult.data) {
    const inventoryResult = await getMaterialInventory(siteResult.data.id)
    inventory = inventoryResult.success ? inventoryResult.data || [] : []
  }

  return (
    <PageLayout
      title="자재 관리"
      description="건설 자재의 재고 관리 및 요청 처리를 관리합니다"
    >
      <Suspense fallback={<LoadingSpinner />}>
        <MaterialManagement 
          materials={materials}
          categories={categories}
          initialInventory={inventory}
          currentUser={profileResult.data}
          currentSite={siteResult.success ? siteResult.data : null}
        />
      </Suspense>
    </PageLayout>
  )
}