/**
 * Admin Monitoring Dashboard Page
 * Displays comprehensive system monitoring and performance metrics
 */

import React from 'react'
import { Metadata } from 'next'
import MonitoringDashboard from '@/components/monitoring/monitoring-dashboard'

export const metadata: Metadata = {
  title: 'System Monitoring - INOPNC Admin',
  description: 'Real-time system monitoring and performance metrics for INOPNC Construction Management System'
}

export default async function MonitoringPage() {
  // Note: AdminPageLayout requires a profile prop but it's not being fetched here
  // This will need to be fixed to fetch the user's profile
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">System Monitoring</h1>
        <p className="text-gray-600 mt-1">Real-time monitoring and performance metrics</p>
      </div>
      <MonitoringDashboard />
    </div>
  )
}