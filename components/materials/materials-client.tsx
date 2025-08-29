'use client'

import { useFontSize, getTypographyClass , getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { Package, AlertTriangle, Clock, Building2 } from 'lucide-react'

export function MaterialsClient() {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  return (
    <div className="space-y-3">
      {/* Compact System Status Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl border border-blue-200 dark:border-blue-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className={`${getFullTypographyClass('heading', 'base', isLargeFont)} font-semibold text-blue-900 dark:text-blue-100`}>
            자재 관리 시스템 준비 중
          </h2>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        </div>
        <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-blue-800 dark:text-blue-200 mb-3`}>
          데이터베이스 마이그레이션 후 다음 기능들을 사용할 수 있습니다:
        </p>
        
        {/* Compact Feature Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className={`bg-white dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-700 ${
            touchMode === 'glove' ? 'p-3' : 
            touchMode === 'precision' ? 'p-1.5' : 
            'p-2'
          }`}>
            <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-blue-900 dark:text-blue-100`}>자재 카탈로그</div>
            <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-blue-700 dark:text-blue-200`}>관리</div>
          </div>
          <div className={`bg-white dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-700 ${
            touchMode === 'glove' ? 'p-3' : 
            touchMode === 'precision' ? 'p-1.5' : 
            'p-2'
          }`}>
            <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-blue-900 dark:text-blue-100`}>현장별 재고</div>
            <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-blue-700 dark:text-blue-200`}>현황</div>
          </div>
          <div className={`bg-white dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-700 ${
            touchMode === 'glove' ? 'p-3' : 
            touchMode === 'precision' ? 'p-1.5' : 
            'p-2'
          }`}>
            <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-blue-900 dark:text-blue-100`}>입출고 거래</div>
            <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-blue-700 dark:text-blue-200`}>내역</div>
          </div>
          <div className={`bg-white dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-700 ${
            touchMode === 'glove' ? 'p-3' : 
            touchMode === 'precision' ? 'p-1.5' : 
            'p-2'
          }`}>
            <div className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-blue-900 dark:text-blue-100`}>NPC-1000</div>
            <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-blue-700 dark:text-blue-200`}>특별 관리</div>
          </div>
        </div>

        {/* Migration Info - Compact */}
        <div className={`bg-white dark:bg-blue-900 rounded-lg border border-blue-100 dark:border-blue-700 ${
          touchMode === 'glove' ? 'p-3' : 
          touchMode === 'precision' ? 'p-1.5' : 
          'p-2'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
              <span className={getFullTypographyClass('caption', 'xs', isLargeFont)}>📁</span>
            </div>
            <div>
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-700 dark:text-gray-300`}>마이그레이션 파일</p>
              <code className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded font-mono text-gray-600 dark:text-gray-400`}>
                20240316_create_material_tables.sql
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Preview - High Density */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${
          touchMode === 'glove' ? 'p-4' : 
          touchMode === 'precision' ? 'p-2' : 
          'p-3'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>전체 자재</div>
              <div className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold text-gray-900 dark:text-gray-100 mt-0.5`}>0개</div>
              <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mt-0.5`}>준비 중</div>
            </div>
            <div className="p-1.5 bg-green-50 dark:bg-green-900 rounded-lg">
              <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${
          touchMode === 'glove' ? 'p-4' : 
          touchMode === 'precision' ? 'p-2' : 
          'p-3'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>NPC-1000</div>
              <div className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold text-gray-900 dark:text-gray-100 mt-0.5`}>0t</div>
              <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mt-0.5`}>재고 없음</div>
            </div>
            <div className="p-1.5 bg-orange-50 dark:bg-orange-900 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${
          touchMode === 'glove' ? 'p-4' : 
          touchMode === 'precision' ? 'p-2' : 
          'p-3'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>승인 대기</div>
              <div className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold text-gray-900 dark:text-gray-100 mt-0.5`}>0건</div>
              <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mt-0.5`}>요청 없음</div>
            </div>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${
          touchMode === 'glove' ? 'p-4' : 
          touchMode === 'precision' ? 'p-2' : 
          'p-3'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>활성 현장</div>
              <div className={`${getFullTypographyClass('heading', 'lg', isLargeFont)} font-bold text-gray-900 dark:text-gray-100 mt-0.5`}>3개</div>
              <div className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} text-gray-500 dark:text-gray-400 mt-0.5`}>운영 중</div>
            </div>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-900 rounded-lg">
              <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}