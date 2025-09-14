'use client'

import * as React from "react"

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    const { isLargeFont } = useFontSize()
    
    return (
      <label
        ref={ref}
        className={cn(
          getFullTypographyClass('body', 'sm', isLargeFont),
          "font-medium text-toss-gray-700 dark:text-toss-gray-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export { Label }