'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface AnalyticsEvent {
  id: string
  event_type: string
  organization_id: string
  site_id?: string
  user_id?: string
  event_data: any
  event_timestamp: string
}

interface UseAnalyticsRealtimeOptions {
  siteId?: string
  eventTypes?: string[]
  onEvent?: (event: AnalyticsEvent) => void
}

export function useAnalyticsRealtime(options: UseAnalyticsRealtimeOptions = {}) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()

  const connect = useCallback(async () => {
    try {
      // Get subscription configuration from API
      const response = await fetch(`/api/analytics/realtime?${new URLSearchParams({
        ...(options.siteId && { siteId: options.siteId })
      })}`)

      if (!response.ok) {
        throw new Error('Failed to get realtime configuration')
      }

      const config = await response.json()

      // Create channel subscription
      const analyticsChannel = supabase
        .channel(config.channel)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'analytics_events',
            filter: options.siteId ? `site_id=eq.${options.siteId}` : undefined
          },
          (payload) => {
            const newEvent = payload.new as AnalyticsEvent
            
            // Filter by event types if specified
            if (options.eventTypes && !options.eventTypes.includes(newEvent.event_type)) {
              return
            }

            // Add to events list
            setEvents(prev => [newEvent, ...prev].slice(0, 100)) // Keep last 100 events
            
            // Call callback if provided
            if (options.onEvent) {
              options.onEvent(newEvent)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'analytics_metrics',
            filter: options.siteId ? `site_id=eq.${options.siteId}` : undefined
          },
          (payload) => {
            // Handle metric updates
            console.log('New metric:', payload.new)
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED')
        })

      setChannel(analyticsChannel)

    } catch (error) {
      console.error('Failed to connect to realtime analytics:', error)
      setIsConnected(false)
    }
  }, [options.siteId, options.eventTypes, options.onEvent, supabase])

  const disconnect = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel)
      setChannel(null)
      setIsConnected(false)
    }
  }, [channel, supabase])

  const emitEvent = useCallback(async (
    eventType: string,
    eventData: any,
    siteId?: string
  ) => {
    try {
      const response = await fetch('/api/analytics/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventType,
          eventData,
          siteId: siteId || options.siteId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to emit event')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to emit analytics event:', error)
      throw error
    }
  }, [options.siteId])

  // Auto-connect on mount
  useEffect(() => {
    connect()
    return () => disconnect()
  }, []) // Empty deps to prevent reconnection on every render

  return {
    events,
    isConnected,
    connect,
    disconnect,
    emitEvent
  }
}