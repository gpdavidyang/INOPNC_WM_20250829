'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 적절한 기본값 설정
            staleTime: 60 * 1000, // 1분
            gcTime: 5 * 60 * 1000, // 5분 (기존 cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: true,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}