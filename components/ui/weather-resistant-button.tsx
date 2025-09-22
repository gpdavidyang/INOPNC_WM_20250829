'use client'


interface WeatherResistantButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  isWeatherMode?: boolean
}

const WeatherResistantButton = forwardRef<HTMLButtonElement, WeatherResistantButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, isWeatherMode = true, ...props }, ref) => {
    const baseClasses = cn(
      // Base styles
      'relative inline-flex items-center justify-center font-semibold transition-all duration-200',
      'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      
      // Weather-resistant enhancements
      isWeatherMode && [
        'border-2', // Thicker borders for visibility
        'shadow-lg', // Enhanced shadows for depth
        'active:scale-95', // Tactile feedback
        'select-none', // Prevent text selection during touch
      ],

      // Size variants with weather-resistant touch targets
      {
        'text-xs px-3 py-2 rounded-md min-h-[44px] min-w-[44px]': size === 'sm',
        'text-sm px-4 py-2.5 rounded-md min-h-[48px] min-w-[48px]': size === 'md', 
        'text-base px-6 py-3 rounded-lg min-h-[56px] min-w-[56px]': size === 'lg',
        'text-lg px-8 py-4 rounded-lg min-h-[64px] min-w-[64px]': size === 'xl',
      },

      // Weather-resistant size enhancements
      isWeatherMode && {
        'min-h-[52px] min-w-[52px] text-sm px-5 py-3': size === 'sm',
        'min-h-[56px] min-w-[56px] text-base px-6 py-3.5': size === 'md',
        'min-h-[64px] min-w-[64px] text-lg px-8 py-4': size === 'lg', 
        'min-h-[72px] min-w-[72px] text-xl px-10 py-5': size === 'xl',
      },

      // Variant styles
      {
        // Primary variant
        'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border-blue-700 focus-visible:ring-blue-500': variant === 'primary',
        
        // Secondary variant
        'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 border-gray-300 focus-visible:ring-gray-500': variant === 'secondary',
        
        // Danger variant
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-red-700 focus-visible:ring-red-500': variant === 'danger',
        
        // Success variant
        'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white border-green-700 focus-visible:ring-green-500': variant === 'success',
      },

      // Weather-resistant variant enhancements
      isWeatherMode && {
        'bg-blue-700 hover:bg-blue-800 border-blue-800 ring-4 ring-blue-500/20': variant === 'primary',
        'bg-gray-200 hover:bg-gray-300 border-gray-400 ring-4 ring-gray-500/20': variant === 'secondary', 
        'bg-red-700 hover:bg-red-800 border-red-800 ring-4 ring-red-500/20': variant === 'danger',
        'bg-green-700 hover:bg-green-800 border-green-800 ring-4 ring-green-500/20': variant === 'success',
      },

      className
    )

    return (
      <button
        ref={ref}
        className={baseClasses}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
        
        {/* Weather-resistant visual feedback overlay */}
        {isWeatherMode && (
          <span 
            className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/10 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}
      </button>
    )
  }
)

WeatherResistantButton.displayName = 'WeatherResistantButton'

export { WeatherResistantButton }