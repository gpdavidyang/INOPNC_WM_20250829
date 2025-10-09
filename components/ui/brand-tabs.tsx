'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

// Brand (Navy) styled Tabs primitives
export const BrandTabs = TabsPrimitive.Root

export const BrandTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { fill?: boolean }
>(({ className, fill = true, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'flex items-center gap-1 rounded-xl border-0 shadow bg-gradient-to-r from-[--brand-600] to-[--brand-700] p-1',
      fill ? 'w-full' : '',
      className
    )}
    {...props}
  />
))
BrandTabsList.displayName = 'BrandTabsList'

export const BrandTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { fill?: boolean }
>(({ className, fill = true, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors',
      fill ? 'flex-1 text-center' : '',
      'text-white/90 hover:text-white',
      'data-[state=active]:bg-white data-[state=active]:text-[--brand-700] data-[state=active]:shadow-md',
      className
    )}
    {...props}
  />
))
BrandTabsTrigger.displayName = 'BrandTabsTrigger'

export const BrandTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('mt-4', className)} {...props} />
))
BrandTabsContent.displayName = 'BrandTabsContent'
