'use client'

import { useState, useEffect } from 'react'
import React from 'react'

/**
 * Mobile UI Upgrade Feature Flag System
 * Allows A/B testing between old and new design
 */

export const useNewDesign = () => {
  const [enabled, setEnabled] = useState(false)
  
  useEffect(() => {
    // DISABLED - Set to false to use original design
    setEnabled(false)
    
    // Original logic (commented out for now)
    // const envFlag = process.env.NEXT_PUBLIC_NEW_DESIGN === 'true'
    // const localFlag = typeof window !== 'undefined' && 
    //   localStorage.getItem('new-design') === 'true'
    // const urlFlag = typeof window !== 'undefined' && 
    //   new URLSearchParams(window.location.search).get('new-design') === 'true'
    // setEnabled(envFlag || localFlag || urlFlag)
  }, [])
  
  return enabled
}

interface FeatureFlagProps {
  flag: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureFlag({ flag, children, fallback = null }: FeatureFlagProps) {
  return flag ? children as React.ReactElement : fallback as React.ReactElement
}

// Higher-order component for conditional rendering
export function withNewDesign<P extends object>(
  NewComponent: React.ComponentType<P>,
  OldComponent: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    const newDesign = useNewDesign()
    return newDesign ? React.createElement(NewComponent, props) : React.createElement(OldComponent, props)
  }
}

// Utility for toggling design in development
export const toggleNewDesign = () => {
  if (typeof window === 'undefined') return
  
  const current = localStorage.getItem('new-design') === 'true'
  localStorage.setItem('new-design', (!current).toString())
  window.location.reload()
}