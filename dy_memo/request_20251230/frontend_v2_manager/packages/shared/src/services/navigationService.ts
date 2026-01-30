import { AppInfo, NavigationState, AppTransition } from '../types'

export class NavigationService {
  private static instance: NavigationService
  private listeners: Map<string, (state: NavigationState) => void> = new Map()
  private currentApp: string = ''
  private storageKey = 'inopnc_navigation_state'

  private constructor() {
    // Listen for storage events from other tabs
    window.addEventListener('storage', this.handleStorageEvent.bind(this))
  }

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService()
    }
    return NavigationService.instance
  }

  // Initialize navigation for current app
  initialize(appInfo: AppInfo) {
    this.currentApp = appInfo.id

    // Load saved state
    const savedState = this.getState()

    // Update current app info
    const updatedState: NavigationState = {
      ...savedState,
      currentApp: appInfo.id,
      currentPath: window.location.pathname,
      lastVisited: {
        ...savedState.lastVisited,
        [appInfo.id]: {
          path: window.location.pathname,
          timestamp: Date.now(),
        },
      },
    }

    this.setState(updatedState)
  }

  // Navigate to another app
  navigateToApp(appId: string, path?: string) {
    const appUrls: Record<string, string> = {
      main: 'http://localhost:3000',
      money: 'http://localhost:3001',
      site: 'http://localhost:3003',
      worklog: 'http://localhost:3002',
      doc: 'http://localhost:3004',
    }

    const url = appUrls[appId]
    if (!url) {
      console.error(`Unknown app: ${appId}`)
      return
    }

    const targetUrl = path ? `${url}${path}` : url

    // Save transition state
    const state = this.getState()
    const transition: AppTransition = {
      fromApp: this.currentApp,
      toApp: appId,
      fromPath: window.location.pathname,
      toPath: path || '/',
      timestamp: Date.now(),
    }

    this.setState({
      ...state,
      transition,
      isTransitioning: true,
    })

    // Open in new tab or current window based on preference
    window.open(targetUrl, '_blank')
  }

  // Get current navigation state
  getState(): NavigationState {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : this.getDefaultState()
    } catch {
      return this.getDefaultState()
    }
  }

  // Set navigation state
  private setState(state: NavigationState) {
    localStorage.setItem(this.storageKey, JSON.stringify(state))
    this.notifyListeners(state)
  }

  // Get default state
  private getDefaultState(): NavigationState {
    return {
      currentApp: '',
      currentPath: '/',
      lastVisited: {},
      theme: 'light',
      isTransitioning: false,
      transition: null,
      userSession: null,
    }
  }

  // Listen for state changes
  subscribe(id: string, callback: (state: NavigationState) => void) {
    this.listeners.set(id, callback)
    callback(this.getState())
  }

  // Unsubscribe from state changes
  unsubscribe(id: string) {
    this.listeners.delete(id)
  }

  // Notify all listeners
  private notifyListeners(state: NavigationState) {
    this.listeners.forEach(callback => callback(state))
  }

  // Handle storage events from other tabs
  private handleStorageEvent(event: StorageEvent) {
    if (event.key === this.storageKey && event.newValue) {
      const newState = JSON.parse(event.newValue)
      this.notifyListeners(newState)
    }
  }

  // Update current path
  updatePath(path: string) {
    const state = this.getState()
    this.setState({
      ...state,
      currentPath: path,
      lastVisited: {
        ...state.lastVisited,
        [this.currentApp]: {
          path,
          timestamp: Date.now(),
        },
      },
    })
  }

  // Get last visited path for an app
  getLastVisited(appId: string): string | null {
    const state = this.getState()
    const visited = state.lastVisited[appId]
    return visited?.path || null
  }

  // Clear transition state
  clearTransition() {
    const state = this.getState()
    this.setState({
      ...state,
      isTransitioning: false,
      transition: null,
    })
  }
}

export const navigationService = NavigationService.getInstance()
