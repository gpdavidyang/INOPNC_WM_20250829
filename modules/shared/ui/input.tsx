'use client'

import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: 'default' | 'sm' | 'lg'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = 'default', ...props }, ref) => {
    const sizeClasses = {
      default:
        'h-[var(--input-h)] rounded-[var(--radius-base)] text-[17px] border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      sm: 'h-9 px-3 text-sm rounded-md',
      lg: 'h-14 px-4 text-lg rounded-[var(--radius-lg)]',
    }

    return (
      <input
        type={type}
        className={`flex w-full border bg-white px-3 py-2 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]} ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export interface FieldProps {
  label: string
  className?: string
  children: React.ReactElement
  error?: string
}

const Field: React.FC<FieldProps> = ({ label, className, children, error }) => {
  const childId = React.useId()

  return (
    <div className={`field ${className || ''}`}>
      {React.cloneElement(children, {
        id: childId,
        className: `q ${children.props.className || ''}`,
        placeholder: ' ', // Keep space for floating label
      })}
      <label htmlFor={childId}>{label}</label>
      {error && <div className="text-sm text-red-500 mt-1">{error}</div>}
    </div>
  )
}

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestions?: Array<{
    id: string
    label: string
    value: string
  }>
  loading?: boolean
  onSuggestionSelect?: (suggestion: any) => void
}

const Search = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ className, suggestions = [], loading, onSuggestionSelect, ...props }, ref) => {
    const [showPanel, setShowPanel] = React.useState(false)
    const [selectedIndex, setSelectedIndex] = React.useState(-1)

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showPanel || suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0) {
            onSuggestionSelect?.(suggestions[selectedIndex])
            setShowPanel(false)
          }
          break
        case 'Escape':
          setShowPanel(false)
          setSelectedIndex(-1)
          break
      }
    }

    return (
      <div className={`search ${className || ''}`}>
        <input
          ref={ref}
          className="input"
          onFocus={() => setShowPanel(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowPanel(false), 200)}
          onKeyDown={handleKeyDown}
          {...props}
        />
        <div className={`spin ${loading ? 'block' : 'hidden'}`} />

        <div className={`panel ${showPanel ? 'show' : ''}`}>
          <ul className="list">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                className={`item ${index === selectedIndex ? 'is-active' : ''}`}
                onClick={() => {
                  onSuggestionSelect?.(suggestion)
                  setShowPanel(false)
                }}
              >
                {suggestion.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }
)
Search.displayName = 'Search'

export { Field, Input, Search }
