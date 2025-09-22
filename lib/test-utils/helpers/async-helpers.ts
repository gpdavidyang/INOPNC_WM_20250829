/**
 * Async Test Helpers
 * 
 * Utilities for handling asynchronous operations in tests including
 * waiting for loading states, elements, and promise resolution.
 */


// Wait for loading to finish by waiting for loading indicators to disappear
export async function waitForLoadingToFinish(options: {
  timeout?: number
  interval?: number
  loadingTestIds?: string[]
  loadingTexts?: string[]
  customSelector?: string
} = {}): Promise<void> {
  const {
    timeout = 5000,
    interval = 50,
    loadingTestIds = ['loading', 'spinner', 'loading-spinner'],
    loadingTexts = ['로딩 중', '불러오는 중', 'Loading...', 'Fetching...'],
    customSelector
  } = options

  return waitFor(
    () => {
      // Check for loading test IDs
      loadingTestIds.forEach(testId => {
        const element = screen.queryByTestId(testId)
        if (element) {
          throw new Error(`Loading indicator still present: ${testId}`)
        }
      })

      // Check for loading text
      loadingTexts.forEach(text => {
        const element = screen.queryByText(text)
        if (element) {
          throw new Error(`Loading text still present: ${text}`)
        }
      })

      // Check for custom selector
      if (customSelector) {
        const element = document.querySelector(customSelector)
        if (element) {
          throw new Error(`Loading element still present: ${customSelector}`)
        }
      }

      // Check for common loading classes
      const loadingClasses = [
        '.animate-spin',
        '.loading',
        '.spinner',
        '[data-loading="true"]',
        '[aria-busy="true"]'
      ]

      loadingClasses.forEach(className => {
        const element = document.querySelector(className)
        if (element) {
          throw new Error(`Loading element still present: ${className}`)
        }
      })
    },
    { timeout, interval }
  )
}

// Wait for element to appear with flexible selectors
export async function waitForElement(
  selector: string | (() => HTMLElement | null),
  options: {
    timeout?: number
    interval?: number
    shouldBeVisible?: boolean
    shouldNotExist?: boolean
  } = {}
): Promise<HTMLElement> {
  const {
    timeout = 5000,
    interval = 50,
    shouldBeVisible = true,
    shouldNotExist = false
  } = options

  return waitFor(
    () => {
      let element: HTMLElement | null = null

      if (typeof selector === 'string') {
        element = document.querySelector(selector)
      } else {
        element = selector()
      }

      if (shouldNotExist) {
        if (element) {
          throw new Error(`Element should not exist but was found: ${selector}`)
        }
        return null as unknown // Type assertion for consistent return type
      }

      if (!element) {
        throw new Error(`Element not found: ${selector}`)
      }

      if (shouldBeVisible && element.offsetParent === null) {
        throw new Error(`Element found but not visible: ${selector}`)
      }

      return element
    },
    { timeout, interval }
  )
}

// Wait for element to have specific text content
export async function waitForElementWithText(
  selector: string,
  expectedText: string | RegExp,
  options: { timeout?: number; exact?: boolean } = {}
): Promise<HTMLElement> {
  const { timeout = 5000, exact = false } = options

  return waitFor(
    () => {
      const element = document.querySelector(selector)
      if (!element) {
        throw new Error(`Element not found: ${selector}`)
      }

      const textContent = element.textContent || ''
      const matches = expectedText instanceof RegExp
        ? expectedText.test(textContent)
        : exact
          ? textContent === expectedText
          : textContent.includes(expectedText)

      if (!matches) {
        throw new Error(
          `Element text does not match. Expected: ${expectedText}, Actual: "${textContent}"`
        )
      }

      return element as HTMLElement
    },
    { timeout }
  )
}

// Flush all pending promises in the microtask queue
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0)
  })
}

// Wait for specific number of async operations to complete
export async function waitForAsyncOperations(count: number, timeout = 5000): Promise<void> {
  let completed = 0
  
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${count} async operations (completed: ${completed})`))
    }, timeout)

    const checkCompletion = () => {
      completed++
      if (completed >= count) {
        clearTimeout(timer)
        resolve()
      }
    }

    // This is a simplified implementation
    // In practice, you'd hook into your specific async mechanisms
    for (let i = 0; i < count; i++) {
      Promise.resolve().then(checkCompletion)
    }
  })
}

// Wait for network requests to complete (mock implementation)
export async function waitForNetworkIdle(options: {
  timeout?: number
  threshold?: number // Time in ms to consider network idle
} = {}): Promise<void> {
  const { timeout = 10000, threshold = 500 } = options

  return new Promise((resolve, reject) => {
    let lastActivity = Date.now()
    let timeoutId: NodeJS.Timeout
    let checkInterval: NodeJS.Timeout

    const cleanup = () => {
      clearTimeout(timeoutId)
      clearInterval(checkInterval)
    }

    // Set overall timeout
    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error('Timeout waiting for network idle'))
    }, timeout)

    // Check for network idle
    checkInterval = setInterval(() => {
      const now = Date.now()
      if (now - lastActivity >= threshold) {
        cleanup()
        resolve()
      }
    }, 100)

    // Mock network activity detection
    // In a real implementation, you'd hook into fetch/XMLHttpRequest
    const originalFetch = global.fetch
    if (originalFetch) {
      global.fetch = async (...args) => {
        lastActivity = Date.now()
        return originalFetch(...args)
      }
    }
  })
}

// Wait for form submission to complete
export async function waitForFormSubmission(
  formSelector: string = 'form',
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 5000 } = options

  return waitFor(
    () => {
      const form = document.querySelector(formSelector) as HTMLFormElement
      if (!form) {
        throw new Error(`Form not found: ${formSelector}`)
      }

      // Check if form is no longer submitting
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement
      if (submitButton?.disabled) {
        throw new Error('Form still submitting')
      }

      // Check for success indicators
      const successIndicators = [
        '[data-testid="success"]',
        '.text-green-500',
        '.success-message',
        '[role="status"]'
      ]

      const hasSuccess = successIndicators.some(selector => 
        document.querySelector(selector)
      )

      if (!hasSuccess) {
        throw new Error('No success indicator found')
      }
    },
    { timeout }
  )
}

// Wait for data to load in a table or list
export async function waitForDataToLoad(
  containerSelector: string,
  options: {
    timeout?: number
    minItems?: number
    emptyStateSelector?: string
  } = {}
): Promise<void> {
  const { timeout = 5000, minItems = 1, emptyStateSelector } = options

  return waitFor(
    () => {
      const container = document.querySelector(containerSelector)
      if (!container) {
        throw new Error(`Container not found: ${containerSelector}`)
      }

      // Check for empty state
      if (emptyStateSelector) {
        const emptyState = container.querySelector(emptyStateSelector)
        if (emptyState) {
          return // Empty state is valid completion
        }
      }

      // Count data items (rows, cards, etc.)
      const itemSelectors = [
        'tr:not(:first-child)', // Table rows (excluding header)
        '[data-testid*="item"]',
        '[data-testid*="row"]',
        '[data-testid*="card"]',
        '.list-item',
        '.card'
      ]

      let itemCount = 0
      for (const selector of itemSelectors) {
        const items = container.querySelectorAll(selector)
        if (items.length > 0) {
          itemCount = items.length
          break
        }
      }

      if (itemCount < minItems) {
        throw new Error(`Not enough items loaded. Expected: ${minItems}, Found: ${itemCount}`)
      }
    },
    { timeout }
  )
}

// Wait for specific route navigation (mock for Next.js router)
export async function waitForNavigation(
  expectedPath: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 5000 } = options

  return waitFor(
    () => {
      // In a real implementation, you'd check the actual router state
      // This is a simplified mock
      const currentPath = window.location.pathname
      if (currentPath !== expectedPath) {
        throw new Error(`Expected path ${expectedPath}, current path ${currentPath}`)
      }
    },
    { timeout }
  )
}

// Debounced wait utility for inputs
export async function waitForInputDebounce(
  inputSelector: string,
  options: { debounceTime?: number; timeout?: number } = {}
): Promise<void> {
  const { debounceTime = 300, timeout = 5000 } = options

  return waitFor(
    () => {
      const input = document.querySelector(inputSelector) as HTMLInputElement
      if (!input) {
        throw new Error(`Input not found: ${inputSelector}`)
      }

      // Check if input has settled (no recent changes)
      const lastChanged = input.getAttribute('data-last-changed')
      const now = Date.now()
      
      if (!lastChanged || now - parseInt(lastChanged) < debounceTime) {
        throw new Error('Input still changing')
      }
    },
    { timeout }
  )
}

// Wait for multiple conditions to be met
export async function waitForAll(
  conditions: Array<() => Promise<unknown> | any>,
  options: { timeout?: number } = {}
): Promise<any[]> {
  const { timeout = 5000 } = options

  return waitFor(
    async () => {
      const results = await Promise.all(
        conditions.map(async condition => {
          try {
            return await condition()
          } catch (error) {
            throw new Error(`Condition failed: ${error.message}`)
          }
        })
      )
      return results
    },
    { timeout }
  )
}

// Wait for any of multiple conditions to be met
export async function waitForAny(
  conditions: Array<() => Promise<unknown> | any>,
  options: { timeout?: number } = {}
): Promise<{ index: number; result: unknown }> {
  const { timeout = 5000 } = options
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout waiting for any condition to be met'))
    }, timeout)

    const checkConditions = async () => {
      for (let i = 0; i < conditions.length; i++) {
        try {
          const result = await conditions[i]()
          clearTimeout(timeoutId)
          resolve({ index: i, result })
          return
        } catch {
          // Continue to next condition
        }
      }

      // If we're still within timeout, try again
      if (Date.now() - startTime < timeout) {
        setTimeout(checkConditions, 50)
      }
    }

    checkConditions()
  })
}

// Advanced async test utilities
export const asyncTestUtils = {
  waitForLoadingToFinish,
  waitForElement,
  waitForElementWithText,
  flushPromises,
  waitForAsyncOperations,
  waitForNetworkIdle,
  waitForFormSubmission,
  waitForDataToLoad,
  waitForNavigation,
  waitForInputDebounce,
  waitForAll,
  waitForAny,

  // Convenience methods for common patterns
  waitForApiCall: () => flushPromises(),
  waitForRerender: () => flushPromises(),
  waitForStateUpdate: () => flushPromises(),
  
  // Korean-specific patterns
  waitForKoreanLoadingToFinish: () => waitForLoadingToFinish({
    loadingTexts: ['로딩 중...', '불러오는 중...', '처리 중...', '저장 중...']
  }),

  waitForKoreanSuccess: () => waitForElement('[data-testid="success"], .text-green-500', {
    timeout: 3000
  }),

  waitForKoreanError: () => waitForElement('[data-testid="error"], .text-red-500', {
    timeout: 3000
  })
}