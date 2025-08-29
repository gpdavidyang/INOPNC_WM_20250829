'use client'

import { useDeepLinking } from '@/hooks/use-deep-linking'

export function DeepLinkProvider() {
  useDeepLinking()
  return null
}