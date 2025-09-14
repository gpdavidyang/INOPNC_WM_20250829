import * as React from "react"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full"
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "xl", children, ...props }, ref) => {
    const sizeClasses = {
      sm: "max-w-3xl",
      md: "max-w-4xl", 
      lg: "max-w-5xl",
      xl: "max-w-7xl",
      full: "max-w-full"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Container.displayName = "Container"

export { Container }