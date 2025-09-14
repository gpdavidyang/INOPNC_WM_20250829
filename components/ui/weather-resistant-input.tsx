'use client'


interface WeatherResistantInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  isWeatherMode?: boolean
  variant?: 'default' | 'large' | 'xl'
}

const WeatherResistantInput = forwardRef<HTMLInputElement, WeatherResistantInputProps>(
  ({ className, label, error, helpText, isWeatherMode = true, variant = 'default', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = error ? `${inputId}-error` : undefined
    const helpId = helpText ? `${inputId}-help` : undefined

    const inputClasses = cn(
      // Base styles
      'w-full rounded-md border bg-white text-gray-900 transition-all duration-200',
      'focus:ring-2 focus:ring-offset-2 focus:outline-none',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'placeholder:text-gray-500',

      // Default sizing
      {
        'px-3 py-2 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[40px]': variant === 'default',
        'px-4 py-3 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[48px]': variant === 'large',
        'px-5 py-4 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[56px]': variant === 'xl',
      },

      // Weather-resistant enhancements
      isWeatherMode && [
        'border-2', // Thicker borders for visibility
        'shadow-inner', // Inset shadow for better definition
        'font-medium', // Slightly bolder text
      ],

      // Weather-resistant sizing
      isWeatherMode && {
        'px-4 py-3 text-base border-gray-400 focus:border-blue-600 focus:ring-blue-600 min-h-[48px]': variant === 'default',
        'px-5 py-4 text-lg border-gray-400 focus:border-blue-600 focus:ring-blue-600 min-h-[56px]': variant === 'large', 
        'px-6 py-5 text-xl border-gray-400 focus:border-blue-600 focus:ring-blue-600 min-h-[64px]': variant === 'xl',
      },

      // Error states
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
      error && isWeatherMode && 'border-red-600 focus:border-red-600 focus:ring-red-600 border-2',

      // Dark mode support
      'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600',
      'dark:focus:border-blue-400 dark:focus:ring-blue-400',
      'dark:placeholder:text-gray-400',
      error && 'dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400',

      className
    )

    const labelClasses = cn(
      'block font-medium text-gray-900 dark:text-gray-100 mb-2',
      {
        'text-sm': variant === 'default',
        'text-base': variant === 'large',
        'text-lg': variant === 'xl',
      },
      isWeatherMode && 'font-semibold', // Stronger labels for weather resistance
      error && 'text-red-700 dark:text-red-400'
    )

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-label="필수 입력">*</span>
            )}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-describedby={cn(helpId, errorId)}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />
          
          {/* Weather-resistant visual enhancement */}
          {isWeatherMode && (
            <div 
              className="absolute inset-0 rounded-[inherit] pointer-events-none border border-gray-300/50 dark:border-gray-600/50"
              aria-hidden="true"
            />
          )}
        </div>

        {helpText && !error && (
          <p 
            id={helpId}
            className={cn(
              'mt-1 text-gray-600 dark:text-gray-400',
              {
                'text-xs': variant === 'default',
                'text-sm': variant === 'large', 
                'text-base': variant === 'xl',
              }
            )}
          >
            {helpText}
          </p>
        )}

        {error && (
          <p 
            id={errorId}
            className={cn(
              'mt-1 text-red-600 dark:text-red-400',
              {
                'text-xs': variant === 'default',
                'text-sm': variant === 'large',
                'text-base': variant === 'xl',
              }
            )}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)

WeatherResistantInput.displayName = 'WeatherResistantInput'

export { WeatherResistantInput }