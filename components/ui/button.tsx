import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-md hover:shadow-lg",
        secondary: "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-gray-500",
        danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-md hover:shadow-lg",
        ghost: "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-gray-500",
        outline: "border-2 bg-transparent border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 focus:ring-gray-500",
        "work-action": "bg-gradient-to-r from-[var(--brand)] to-[var(--brand-light)] hover:from-[var(--brand-dark)] hover:to-[var(--brand)] text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200 rounded-xl",
        "photo-upload": "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-2 border-dashed border-blue-300 dark:border-blue-700 text-[var(--num)] font-medium transition-colors duration-200 rounded-xl flex flex-col items-center gap-2"
      },
      size: {
        compact: "px-3 py-1.5 text-sm min-h-[40px]", // Dense interfaces, secondary actions
        standard: "px-4 py-2 text-base min-h-[48px]", // Default touch target size
        field: "px-6 py-3 text-base min-h-[60px]", // Construction field conditions
        critical: "px-8 py-4 text-lg min-h-[64px]", // Emergency actions, safety critical
        full: "w-full px-6 py-3 text-base min-h-[48px]" // Full width with standard height
      },
      touchMode: {
        normal: "",
        glove: "min-h-[56px] px-6", // Larger touch targets for glove use
        precision: "min-h-[44px] px-3" // Smaller for precise interactions
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "standard",
      touchMode: "normal"
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, touchMode, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, touchMode, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }