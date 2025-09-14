'use client'


export function ThemeInitializer() {
  const { setTheme } = useTheme()
  const { user } = useAuthContext()

  useEffect(() => {
    // Set light mode as default for all users
    if (user) {
      // Check if theme has been explicitly set by user
      const hasUserPreference = localStorage.getItem('theme-user-preference')
      
      if (!hasUserPreference) {
        // Set light mode for all users on first login
        setTheme('light')
        localStorage.setItem('theme-user-preference', 'auto-set')
      } else {
        // For returning users, use saved theme preference
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme && savedTheme !== 'system') {
          setTheme(savedTheme)
        } else {
          // Default to light if no specific preference
          setTheme('light')
        }
      }
    }
  }, [user, setTheme])

  useEffect(() => {
    // Initialize theme on mount for non-authenticated state
    if (!user) {
      const savedTheme = localStorage.getItem('theme') || 'light'
      
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [user])

  return null
}