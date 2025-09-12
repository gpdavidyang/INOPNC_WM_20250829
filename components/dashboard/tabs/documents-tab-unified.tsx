'use client'

import { useState, useEffect, useCallback } from 'react'
import { Profile } from '@/types'
import DocumentsTabRedesigned from './documents-tab-redesigned'

interface DocumentsTabUnifiedProps {
  profile: Profile
  initialTab?: 'personal' | 'shared' | 'markup' | 'required'
  initialSearch?: string
}

export default function DocumentsTabUnified({ profile, initialTab = 'personal', initialSearch }: DocumentsTabUnifiedProps) {
  // 새로운 통합 디자인 사용
  return <DocumentsTabRedesigned profile={profile} />
}