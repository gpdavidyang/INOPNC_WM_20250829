'use client'

import { useState } from 'react'

export const useFormSections = (canManageWorkers: boolean, canViewAdvancedFeatures: boolean) => {
  const [expandedSections, setExpandedSections] = useState({
    siteInfo: true,
    workContent: true,
    workers: canManageWorkers,
    photos: false,
    additionalPhotos: false,
    drawings: false,
    requests: false,
    materials: canViewAdvancedFeatures,
    specialNotes: false,
    adminFeatures: false,
  })

  const [allExpanded, setAllExpanded] = useState(false)

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const toggleAllSections = () => {
    const nextState = !allExpanded
    setAllExpanded(nextState)
    setExpandedSections({
      siteInfo: nextState,
      workContent: nextState,
      workers: nextState,
      photos: nextState,
      additionalPhotos: nextState,
      drawings: nextState,
      requests: nextState,
      materials: nextState,
      specialNotes: nextState,
      adminFeatures: nextState,
    })
  }

  return {
    expandedSections,
    allExpanded,
    toggleSection,
    toggleAllSections,
  }
}
