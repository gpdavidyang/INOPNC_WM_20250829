'use client'


interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  canAccess: (requiredRoles: string[]) => boolean
  canAccessSite: (siteId: string) => Promise<boolean>
  getUserSites: () => Promise<{ id: string; name: string }[]>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()
  const profileManager = new ProfileManager()

  // Fetch and update user profile
  const fetchProfile = async (userId: string) => {
    try {
      setError(null)
      const result = await profileManager.checkProfile(userId)
      
      if (!result.exists || !result.isComplete) {
        // Profile doesn't exist or is incomplete, try to create/update it
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const upsertResult = await profileManager.upsertProfile(authUser)
          if (upsertResult.success) {
            // Fetch the updated profile
            const updatedResult = await profileManager.checkProfile(userId)
            if (updatedResult.profile) {
              setProfile(updatedResult.profile)
            }
          } else {
            setError(upsertResult.error || 'Failed to update profile')
          }
        }
      } else if (result.profile) {
        setProfile(result.profile)
        // Update login stats
        await profileManager.updateLoginStats(userId)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load user profile')
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true)
        
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        }
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              setUser(session.user)
              await fetchProfile(session.user.id)
              
              // Redirect based on role
              if (profile?.role) {
                const redirectPath = profileManager.getRoleBasedRedirect(profile.role)
                router.push(redirectPath)
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null)
              setProfile(null)
              router.push('/auth/login')
            } else if (event === 'USER_UPDATED' && session?.user) {
              setUser(session.user)
              await fetchProfile(session.user.id)
            }
          }
        )

        return () => {
          subscription.unsubscribe()
        }
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        await profileManager.logAuthEvent(email, 'login_failed', { error: error.message })
        return { success: false, error: error.message }
      }

      if (data.user) {
        setUser(data.user)
        await fetchProfile(data.user.id)
      }

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign in'
      return { success: false, error: errorMessage }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      if (user) {
        await profileManager.logAuthEvent(user.id, 'logout')
      }
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setProfile(null)
      router.push('/auth/login')
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  // Check if user has required roles
  const canAccess = (requiredRoles: string[]): boolean => {
    if (!profile?.role) return false
    return requiredRoles.includes(profile.role)
  }

  // Check if user can access specific site
  const canAccessSite = async (siteId: string): Promise<boolean> => {
    if (!user) return false
    return await profileManager.canAccessSite(user.id, siteId)
  }

  // Get user's accessible sites
  const getUserSites = async (): Promise<{ id: string; name: string }[]> => {
    if (!user) return []
    return await profileManager.getUserSites(user.id)
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    signIn,
    signOut,
    refreshProfile,
    canAccess,
    canAccessSite,
    getUserSites,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRoles?: string[]
    redirectTo?: string
  }
) {
  return function ProtectedComponent(props: P) {
    const { user, profile, loading, canAccess } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push(options?.redirectTo || '/auth/login')
        } else if (options?.requiredRoles && profile && !canAccess(options.requiredRoles)) {
          router.push('/unauthorized')
        }
      }
    }, [user, profile, loading])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )
    }

    if (!user || (options?.requiredRoles && !profile)) {
      return null
    }

    if (options?.requiredRoles && profile && !canAccess(options.requiredRoles)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}

// Hook for role-based UI rendering
export function useRoleBasedAccess() {
  const { profile } = useAuth()

  const isSystemAdmin = profile?.role === 'system_admin'
  const isAdmin = profile?.role === 'admin' || isSystemAdmin
  const isSiteManager = profile?.role === 'site_manager' || isAdmin
  const isCustomerManager = profile?.role === 'customer_manager'
  const isWorker = profile?.role === 'worker'

  return {
    isSystemAdmin,
    isAdmin,
    isSiteManager,
    isCustomerManager,
    isWorker,
    role: profile?.role,
    canManageUsers: isAdmin,
    canManageSites: isAdmin,
    canApproveReports: isSiteManager,
    canCreateReports: isWorker || isSiteManager,
    canViewAllReports: isAdmin || isCustomerManager,
  }
}