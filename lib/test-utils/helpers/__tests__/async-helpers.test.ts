import {
  waitForLoadingToFinish,
  waitForElement,
  waitForElementWithText,
  flushPromises,
  waitForFormSubmission,
  waitForDataToLoad,
  asyncTestUtils
} from '../async-helpers'

// Mock DOM environment
const mockElement = (html: string) => {
  document.body.innerHTML = html
}

describe('Async Helpers', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    jest.clearAllTimers()
  })

  describe('waitForLoadingToFinish', () => {
    it('should wait for loading indicators to disappear', async () => {
      // Start with loading indicator
      mockElement('<div data-testid="loading">Loading...</div>')
      
      // Remove loading indicator after delay
      setTimeout(() => {
        document.body.innerHTML = '<div>Content loaded</div>'
      }, 100)
      
      await expect(waitForLoadingToFinish({ timeout: 1000 })).resolves.toBeUndefined()
    })

    it('should timeout if loading never finishes', async () => {
      mockElement('<div data-testid="loading">Loading...</div>')
      
      await expect(
        waitForLoadingToFinish({ timeout: 100 })
      ).rejects.toThrow('Loading indicator still present')
    })

    it('should check for Korean loading text', async () => {
      mockElement('<div>로딩 중</div>')
      
      setTimeout(() => {
        document.body.innerHTML = '<div>완료</div>'
      }, 100)
      
      await expect(waitForLoadingToFinish({ timeout: 1000 })).resolves.toBeUndefined()
    })

    it('should check custom selectors', async () => {
      mockElement('<div class="custom-loading">Loading</div>')
      
      setTimeout(() => {
        document.body.innerHTML = '<div>Content</div>'
      }, 100)
      
      await expect(
        waitForLoadingToFinish({ 
          timeout: 1000, 
          customSelector: '.custom-loading' 
        })
      ).resolves.toBeUndefined()
    })
  })

  describe('waitForElement', () => {
    it('should wait for element to appear', async () => {
      setTimeout(() => {
        mockElement('<div id="target">Target Element</div>')
      }, 100)
      
      const element = await waitForElement('#target', { 
        timeout: 1000, 
        shouldBeVisible: false 
      })
      expect(element.id).toBe('target')
    })

    it('should timeout if element never appears', async () => {
      await expect(
        waitForElement('#nonexistent', { timeout: 100 })
      ).rejects.toThrow('Element not found')
    })

    it('should check element visibility', async () => {
      mockElement('<div id="hidden" style="display: none;">Hidden</div>')
      
      await expect(
        waitForElement('#hidden', { timeout: 100, shouldBeVisible: true })
      ).rejects.toThrow('Element found but not visible')
    })

    it('should work with function selectors', async () => {
      setTimeout(() => {
        mockElement('<div class="dynamic">Dynamic Element</div>')
      }, 100)
      
      const element = await waitForElement(
        () => document.querySelector('.dynamic'),
        { timeout: 1000, shouldBeVisible: false }
      )
      expect(element.className).toBe('dynamic')
    })

    it('should verify element does not exist', async () => {
      await expect(
        waitForElement('#nonexistent', { timeout: 100, shouldNotExist: true })
      ).resolves.toBeNull()
    })
  })

  describe('waitForElementWithText', () => {
    it('should wait for element with specific text', async () => {
      setTimeout(() => {
        mockElement('<div id="target">Expected Text</div>')
      }, 100)
      
      const element = await waitForElementWithText('#target', 'Expected Text')
      expect(element.textContent).toBe('Expected Text')
    })

    it('should work with regex patterns', async () => {
      setTimeout(() => {
        mockElement('<div id="target">Text with 123 numbers</div>')
      }, 100)
      
      const element = await waitForElementWithText('#target', /\d+/)
      expect(element.textContent).toContain('123')
    })

    it('should support exact matching', async () => {
      mockElement('<div id="target">Partial Text Match</div>')
      
      await expect(
        waitForElementWithText('#target', 'Partial', { exact: true, timeout: 100 })
      ).rejects.toThrow('Element text does not match')
    })
  })

  describe('flushPromises', () => {
    it('should flush microtask queue', async () => {
      let resolved = false
      Promise.resolve().then(() => { resolved = true })
      
      expect(resolved).toBe(false)
      await flushPromises()
      expect(resolved).toBe(true)
    })
  })

  describe('waitForFormSubmission', () => {
    it('should wait for form submission to complete', async () => {
      mockElement(`
        <form>
          <button type="submit" disabled>Submitting...</button>
        </form>
      `)
      
      setTimeout(() => {
        document.body.innerHTML = `
          <form>
            <button type="submit">Submit</button>
            <div data-testid="success">Success!</div>
          </form>
        `
      }, 100)
      
      await expect(waitForFormSubmission('form', { timeout: 1000 })).resolves.toBeUndefined()
    })

    it('should timeout if no success indicator', async () => {
      mockElement(`
        <form>
          <button type="submit">Submit</button>
        </form>
      `)
      
      await expect(
        waitForFormSubmission('form', { timeout: 100 })
      ).rejects.toThrow('No success indicator found')
    })
  })

  describe('waitForDataToLoad', () => {
    it('should wait for minimum items to load', async () => {
      setTimeout(() => {
        mockElement(`
          <div id="container">
            <div data-testid="item">Item 1</div>
            <div data-testid="item">Item 2</div>
            <div data-testid="item">Item 3</div>
          </div>
        `)
      }, 100)
      
      await expect(
        waitForDataToLoad('#container', { timeout: 1000, minItems: 2 })
      ).resolves.toBeUndefined()
    })

    it('should handle empty state', async () => {
      mockElement(`
        <div id="container">
          <div class="empty-state">No data available</div>
        </div>
      `)
      
      await expect(
        waitForDataToLoad('#container', { 
          timeout: 1000, 
          emptyStateSelector: '.empty-state' 
        })
      ).resolves.toBeUndefined()
    })

    it('should timeout if not enough items', async () => {
      mockElement(`
        <div id="container">
          <div data-testid="item">Item 1</div>
        </div>
      `)
      
      await expect(
        waitForDataToLoad('#container', { timeout: 100, minItems: 3 })
      ).rejects.toThrow('Not enough items loaded')
    })
  })

  describe('asyncTestUtils', () => {
    it('should provide Korean-specific utilities', async () => {
      setTimeout(() => {
        document.body.innerHTML = '<div>Content loaded</div>'
      }, 100)
      
      await expect(
        asyncTestUtils.waitForKoreanLoadingToFinish()
      ).resolves.toBeUndefined()
    })

    it('should provide convenience methods', async () => {
      expect(asyncTestUtils.waitForApiCall).toBeDefined()
      expect(asyncTestUtils.waitForRerender).toBeDefined()
      expect(asyncTestUtils.waitForStateUpdate).toBeDefined()
    })

    it('should provide Korean success/error utilities', () => {
      expect(asyncTestUtils.waitForKoreanSuccess).toBeDefined()
      expect(asyncTestUtils.waitForKoreanError).toBeDefined()
    })
  })
})