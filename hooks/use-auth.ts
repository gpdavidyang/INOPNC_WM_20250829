'use client'


export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user)
        // Force a page refresh to ensure server components get the new auth state
        router.refresh()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/auth/login')
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase.auth])

  return { user, loading }
}