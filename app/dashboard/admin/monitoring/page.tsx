/**
 * Admin Monitoring Dashboard Page
 * Displays comprehensive system monitoring and performance metrics
 */

import React from 'react'
import { Metadata } from 'next'
import MonitoringDashboard from '@/components/monitoring/monitoring-dashboard'
import AdminPageLayout from '@/components/admin/AdminPageLayout'

export const metadata: Metadata = {
  title: 'System Monitoring - INOPNC Admin',
  description: 'Real-time system monitoring and performance metrics for INOPNC Construction Management System'
}

export default function MonitoringPage() {
  return (
    <AdminPageLayout 
      title="System Monitoring"
      description="Real-time monitoring and performance metrics"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin', href: '/dashboard/admin' },
        { label: 'Monitoring', href: '/dashboard/admin/monitoring' }
      ]}
    >
      <MonitoringDashboard />
    </AdminPageLayout>
  )
}