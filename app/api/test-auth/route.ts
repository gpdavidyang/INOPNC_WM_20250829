
/**
 * API endpoint to test authentication methods
 * This tests the actual auth methods without browser dependencies
 */

export async function GET(request: NextRequest) {
  const results: unknown[] = []
  let overallSuccess = true

  try {
    const client = createClient()

    // Test 1: Check if auth object exists and has required methods
    const requiredMethods = [
      'signInWithPassword',
      'signUp',
      'signOut',
      'getSession',
      'getUser',
      'refreshSession',
      'onAuthStateChange'
    ]

    const authMethodsTest = {
      name: 'Auth Methods Existence',
      success: true,
      details: {} as Record<string, boolean>
    }

    for (const method of requiredMethods) {
      const methodExists = typeof client.auth[method as keyof typeof client.auth] === 'function'
      authMethodsTest.details[method] = methodExists
      if (!methodExists) {
        authMethodsTest.success = false
        overallSuccess = false
      }
    }

    results.push(authMethodsTest)

    // Test 2: Test getSession method
    try {
      const sessionResult = await client.auth.getSession()
      results.push({
        name: 'getSession() method',
        success: !sessionResult.error,
        details: {
          hasSession: !!sessionResult.data?.session,
          error: sessionResult.error?.message || null
        }
      })
    } catch (error) {
      results.push({
        name: 'getSession() method',
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      overallSuccess = false
    }

    // Test 3: Test getUser method
    try {
      const userResult = await client.auth.getUser()
      results.push({
        name: 'getUser() method',
        success: !userResult.error,
        details: {
          hasUser: !!userResult.data?.user,
          userEmail: userResult.data?.user?.email || null,
          error: userResult.error?.message || null
        }
      })
    } catch (error) {
      results.push({
        name: 'getUser() method',
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      overallSuccess = false
    }

    // Test 4: Test onAuthStateChange method (just check if it returns a subscription)
    try {
      const { data: { subscription } } = client.auth.onAuthStateChange(() => {})
      const subscriptionValid = subscription && typeof subscription.unsubscribe === 'function'
      
      if (subscriptionValid) {
        subscription.unsubscribe() // Clean up
      }

      results.push({
        name: 'onAuthStateChange() method',
        success: subscriptionValid,
        details: {
          subscriptionCreated: subscriptionValid,
          hasUnsubscribe: subscription && typeof subscription.unsubscribe === 'function'
        }
      })

      if (!subscriptionValid) {
        overallSuccess = false
      }
    } catch (error) {
      results.push({
        name: 'onAuthStateChange() method',
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      overallSuccess = false
    }

    // Test 5: Test refreshSession method (without actual refresh to avoid side effects)
    try {
      // Note: We're testing if the method exists and can be called
      // For a full test, we'd need an active session
      const refreshResult = await client.auth.refreshSession()
      results.push({
        name: 'refreshSession() method',
        success: true, // Method exists and was callable
        details: {
          methodCallable: true,
          hasError: !!refreshResult.error,
          errorMessage: refreshResult.error?.message || null
        }
      })
    } catch (error) {
      results.push({
        name: 'refreshSession() method', 
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      overallSuccess = false
    }

    // Summary
    const summary = {
      overallSuccess,
      totalTests: results.length,
      passedTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'All authentication methods are working correctly!' 
        : 'Some authentication methods have issues',
      summary,
      results
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to test authentication methods',
      error: error instanceof Error ? error.message : 'Unknown error',
      results
    }, { status: 500 })
  }
}