'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

// Gradient pill-style tabs used across admin screens
// Matches the style used in Materials page tab bar

export const PillTabs = TabsPrimitive.Root

export const PillTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { fill?: boolean }
>(({ className, fill = false, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1 rounded-xl border-0 shadow bg-gradient-to-r from-[--brand-600] to-[--brand-700] p-1 h-auto min-w-0',
      fill ? 'w-full' : '',
      className
    )}
    {...props}
  />
))
PillTabsList.displayName = 'PillTabsList'

export const PillTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { fill?: boolean }
>(({ className, fill = false, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'px-3 py-1.5 text-sm rounded-md transition-colors text-white/90 hover:text-white',
      fill ? 'flex-1 basis-0 grow text-center' : '',
      'data-[state=active]:bg-white data-[state=active]:text-[--brand-700] data-[state=active]:shadow-md',
      // Hide underline decoration that the default TabsTrigger adds
      'data-[state=active]:after:hidden',
      className
    )}
    {...props}
  />
))
PillTabsTrigger.displayName = 'PillTabsTrigger'

export const PillTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('mt-4', className)} {...props} />
))
PillTabsContent.displayName = 'PillTabsContent'
