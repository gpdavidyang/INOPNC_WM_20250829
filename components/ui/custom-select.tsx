'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const CustomSelect = SelectPrimitive.Root

const CustomSelectGroup = SelectPrimitive.Group

const CustomSelectValue = SelectPrimitive.Value

const CustomSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-11 w-full items-center justify-between rounded-xl border',
      'bg-gray-50 dark:bg-gray-800',
      'border-gray-200 dark:border-gray-700',
      'px-4 py-2 text-sm font-semibold',
      'text-gray-900 dark:text-gray-100',
      'hover:border-gray-300 dark:hover:border-gray-600',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-all duration-200',
      '[&>span]:line-clamp-1',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
CustomSelectTrigger.displayName = 'CustomSelectTrigger'

const CustomSelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
  </SelectPrimitive.ScrollUpButton>
))
CustomSelectScrollUpButton.displayName = 'CustomSelectScrollUpButton'

const CustomSelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
  </SelectPrimitive.ScrollDownButton>
))
CustomSelectScrollDownButton.displayName = 'CustomSelectScrollDownButton'

const CustomSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(
  (
    { className, children, position = 'popper', sideOffset = 5, align = 'start', ...props },
    ref
  ) => (
    <SelectPrimitive.Portal container={typeof window !== 'undefined' ? document.body : undefined}>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'relative z-[100000] max-h-96 min-w-[8rem] overflow-hidden rounded-md border',
          '!bg-white dark:!bg-[#0f172a]/95',
          'border-gray-200 dark:border-gray-700',
          'text-gray-900 dark:text-gray-100',
          'shadow-xl',
          'backdrop-blur-sm',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={10}
        style={{ zIndex: 999999 }}
        {...props}
      >
        <CustomSelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            '!bg-white dark:!bg-[#0f172a]/95',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <CustomSelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
)
CustomSelectContent.displayName = 'CustomSelectContent'

const CustomSelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'py-1.5 pl-8 pr-2 text-sm font-semibold',
      'text-gray-700 dark:text-gray-300',
      className
    )}
    {...props}
  />
))
CustomSelectLabel.displayName = 'CustomSelectLabel'

const CustomSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm',
      'py-2 pl-8 pr-2 text-sm font-medium outline-none',
      'text-gray-900 dark:text-gray-100',
      'hover:bg-gray-100 dark:hover:bg-gray-700',
      'focus:bg-blue-50 dark:focus:bg-blue-900/20',
      'focus:text-blue-600 dark:focus:text-blue-400',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'transition-colors duration-150',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
CustomSelectItem.displayName = 'CustomSelectItem'

const CustomSelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px', 'bg-gray-200 dark:bg-gray-700', className)}
    {...props}
  />
))
CustomSelectSeparator.displayName = 'CustomSelectSeparator'

// Export with backwards compatibility aliases
export {
  CustomSelect,
  CustomSelectGroup,
  CustomSelectValue,
  CustomSelectTrigger,
  CustomSelectContent,
  CustomSelectLabel,
  CustomSelectItem,
  CustomSelectSeparator,
  CustomSelectScrollUpButton,
  CustomSelectScrollDownButton,
  // Aliases for easier migration
  CustomSelect as Select,
  CustomSelectGroup as SelectGroup,
  CustomSelectValue as SelectValue,
  CustomSelectTrigger as SelectTrigger,
  CustomSelectContent as SelectContent,
  CustomSelectLabel as SelectLabel,
  CustomSelectItem as SelectItem,
  CustomSelectSeparator as SelectSeparator,
}

// Default export for backwards compatibility
export default CustomSelect
