'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Camera, Download, Eye, FileText } from 'lucide-react'
import React from 'react'

interface PhotosSectionProps {
  formData: any
}

export const PhotosSection = ({ formData }: PhotosSectionProps) => {
  const beforePhotos = formData?.before_photos || []
  const afterPhotos = formData?.after_photos || []
  const receipts = formData?.receipts || []

  const renderPhotoGrid = (photos: any[], title: string, icon: React.ReactNode) => (
    <Card className="p-5 border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo: any, index: number) => (
            <div
              key={index}
              className="relative aspect-square group overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <img
                src={photo.url || photo.path || photo}
                alt={`${title} ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              {photo.description && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 backdrop-blur-sm">
                  <p className="text-[10px] text-white text-center truncate font-medium">
                    {photo.description}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-400">등록된 사진이 없습니다.</p>
        </div>
      )}
    </Card>
  )

  return (
    <div className="space-y-6">
      {renderPhotoGrid(beforePhotos, '작업 전 사진', <Camera className="w-5 h-5 text-blue-500" />)}
      {renderPhotoGrid(afterPhotos, '작업 후 사진', <Camera className="w-5 h-5 text-green-500" />)}

      {/* Receipts */}
      <Card className="p-5 border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-500" />
          영수증 첨부
        </h3>
        {receipts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {receipts.map((receipt: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {receipt.filename || `영수증_${index + 1}`}
                    </p>
                    <div className="flex gap-2 text-[11px] text-gray-500 font-medium">
                      {receipt.amount && (
                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                          ₩{receipt.amount.toLocaleString()}
                        </span>
                      )}
                      {receipt.vendor && <span>• {receipt.vendor}</span>}
                      {receipt.date && <span>• {receipt.date}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    다운로드
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-400">등록된 영수증이 없습니다.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
