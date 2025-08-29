"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  size?: 'sm' | 'md' | 'lg'
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: {
      root: "h-4 w-7",
      thumb: "h-3 w-3 data-[state=checked]:translate-x-3"
    },
    md: {
      root: "h-6 w-11", 
      thumb: "h-5 w-5 data-[state=checked]:translate-x-5"
    },
    lg: {
      root: "h-7 w-12",
      thumb: "h-6 w-6 data-[state=checked]:translate-x-5"
    }
  }

  return (
    <SwitchPrimitives.Root
      className={cn(
        // Base styles
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 ease-in-out",
        // Focus and disabled states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900",
        "disabled:cursor-not-allowed disabled:opacity-40",
        // Enhanced colors for better visibility
        "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600",
        "data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:border-gray-300",
        "dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500",
        "dark:data-[state=unchecked]:bg-gray-600 dark:data-[state=unchecked]:border-gray-600",
        // Hover effects
        "hover:data-[state=checked]:bg-blue-700 hover:data-[state=unchecked]:bg-gray-400",
        "dark:hover:data-[state=checked]:bg-blue-400 dark:hover:data-[state=unchecked]:bg-gray-500",
        // Shadow for depth
        "shadow-sm hover:shadow-md",
        // Size classes
        sizeClasses[size].root,
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          // Base styles
          "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-all duration-200 ease-in-out",
          // Enhanced shadow and border
          "shadow-md border border-gray-200 dark:border-gray-300",
          // Size and position classes
          sizeClasses[size].thumb,
          "data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }