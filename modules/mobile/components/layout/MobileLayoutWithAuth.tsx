'use client'

import React, { ReactNode } from 'react'
import { MobileLayout } from './MobileLayout'

interface MobileLayoutWithAuthProps {
  children: ReactNode
}

export const MobileLayoutWithAuth: React.FC<MobileLayoutWithAuthProps> = ({
  children,
}) => {
  // Ultra Simple Auth handles authentication at the middleware level
  // No Provider system needed - just render the layout directly
  return <MobileLayout>{children}</MobileLayout>
}
