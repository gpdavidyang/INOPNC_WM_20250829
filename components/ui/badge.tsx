'use client'

import * as React from "react"

const badgeVariants = cva(
  "inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-toss-blue-100 text-toss-blue-900",
        secondary:
          "border-transparent bg-toss-gray-100 text-toss-gray-900",
        success:
          "border-transparent bg-green-100 text-green-800",
        warning:
          "border-transparent bg-orange-100 text-orange-800",
        error:
          "border-transparent bg-red-100 text-red-800",
        outline: "text-toss-gray-900 border border-toss-gray-200",
      },
      touchMode: {
        normal: "px-2.5 py-0.5",
        glove: "px-3 py-1",
        precision: "px-2 py-0.25"
      }
    },
    defaultVariants: {
      variant: "default",
      touchMode: "normal"
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  return (
    <div 
      className={cn(
        badgeVariants({ variant, touchMode }), 
        getFullTypographyClass('caption', 'xs', isLargeFont),
        className
      )} 
      {...props} 
    />
  )
}

export { Badge, badgeVariants }