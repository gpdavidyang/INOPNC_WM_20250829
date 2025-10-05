import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary:
          'bg-[--brand-600] hover:bg-[--brand-700] focus:ring-[--focus] text-white shadow-button',
        secondary:
          'bg-white text-[--brand-700] border border-[--brand-300] hover:bg-[--neutral-50] focus:ring-[--focus]',
        danger:
          'bg-[--accent-600] hover:brightness-95 focus:ring-[--accent-600] text-white shadow-button',
        destructive:
          'bg-[--accent-600] hover:brightness-95 focus:ring-[--accent-600] text-white shadow-button',
        ghost: 'text-[--brand-700] hover:bg-[--neutral-50] focus:ring-[--focus]',
        outline:
          'border bg-transparent border-[--brand-400] hover:bg-[--brand-300]/15 text-[--brand-700] focus:ring-[--focus]',
        'work-action':
          'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-light)] hover:from-[var(--brand-dark)] hover:to-[var(--brand)] text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200 rounded-xl',
        'photo-upload':
          'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-2 border-dashed border-blue-300 dark:border-blue-700 text-[var(--num)] font-medium transition-colors duration-200 rounded-xl flex flex-col items-center gap-2',
      },
      size: {
        compact: 'px-3 py-1.5 text-sm min-h-[36px]', // Dense interfaces
        standard: 'px-4 py-2 text-base min-h-[44px]', // Admin default touch target
        field: 'px-6 py-3 text-base min-h-[56px]', // Field conditions
        critical: 'px-8 py-4 text-lg min-h-[64px]', // Emergency actions
        full: 'w-full px-6 py-3 text-base min-h-[44px]', // Full width, standard height
      },
      touchMode: {
        normal: '',
        glove: 'min-h-[56px] px-6', // Larger touch targets for glove use
        precision: 'min-h-[44px] px-3', // Smaller for precise interactions
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'standard',
      touchMode: 'normal',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, touchMode, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button'
    // Backward-compat: map legacy sizes to current scale
    const normalizedSize = (
      size === 'sm' ? 'compact' : size === 'md' ? 'standard' : size === 'lg' ? 'field' : size
    ) as ButtonProps['size']
    return (
      <Comp
        className={cn(buttonVariants({ variant, size: normalizedSize, touchMode, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
