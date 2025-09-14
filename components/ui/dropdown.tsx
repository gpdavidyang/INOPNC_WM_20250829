'use client'

import * as React from "react"

export interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
}

export interface DropdownProps {
  options: DropdownOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ options, value, onChange, placeholder = "선택하세요", disabled, className }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (option: DropdownOption) => {
      if (!option.disabled) {
        onChange?.(option.value)
        setIsOpen(false)
      }
    }

    return (
      <div ref={dropdownRef} className={cn("relative", className)}>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full justify-between h-12 px-3 font-normal",
            !selectedOption && "text-toss-gray-500",
            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={cn(
            "ml-2 h-4 w-4 shrink-0 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>
        
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-toss-gray-200 dark:border-toss-gray-700 bg-white dark:bg-toss-gray-800 shadow-lg">
            <div className="max-h-60 overflow-auto">
              {options.map((option: unknown) => (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "relative flex cursor-pointer items-center px-3 py-2.5 text-sm transition-colors",
                    "hover:bg-toss-gray-100 dark:hover:bg-toss-gray-700",
                    option.disabled && "cursor-not-allowed opacity-50",
                    value === option.value && "bg-toss-blue-50 dark:bg-toss-blue-900/20"
                  )}
                >
                  <span className={cn(
                    "block truncate",
                    value === option.value && "font-medium"
                  )}>
                    {option.label}
                  </span>
                  {value === option.value && (
                    <Check className="ml-auto h-4 w-4 text-toss-blue-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
)
Dropdown.displayName = "Dropdown"

export { Dropdown }