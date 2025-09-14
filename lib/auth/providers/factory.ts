/**
 * Auth Provider Factory
 *
 * Creates and manages auth provider instances.
 * Enables runtime switching between providers.
 */

import { IAuthProvider, IAuthProviderFactory, AuthProviderConfig } from './types'
import { SupabaseAuthProvider } from './supabase-provider'
import { MockAuthProvider } from './mock-provider'

/**
 * Auth Provider Factory Implementation
 */
export class AuthProviderFactory implements IAuthProviderFactory {
  private static instance: AuthProviderFactory
  private providers: Map<string, IAuthProvider> = new Map()
  private currentProvider: IAuthProvider | null = null

  /**
   * Get singleton instance
   */
  static getInstance(): AuthProviderFactory {
    if (!AuthProviderFactory.instance) {
      AuthProviderFactory.instance = new AuthProviderFactory()
    }
    return AuthProviderFactory.instance
  }

  /**
   * Private constructor for singleton
   */
  private constructor() {}

  /**
   * Create a provider instance
   */
  createProvider(type: 'supabase' | 'mock', config: AuthProviderConfig = {}): IAuthProvider {
    // Check if provider already exists
    const cacheKey = `${type}-${JSON.stringify(config)}`
    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!
    }

    let provider: IAuthProvider

    switch (type) {
      case 'supabase':
        provider = new SupabaseAuthProvider(config)
        break
      case 'mock':
        provider = new MockAuthProvider(config)
        break
      default:
        throw new Error(`Unknown provider type: ${type}`)
    }

    // Cache the provider
    this.providers.set(cacheKey, provider)

    // Set as current if first provider
    if (!this.currentProvider) {
      this.currentProvider = provider
    }

    return provider
  }

  /**
   * Get the current active provider
   */
  getCurrentProvider(): IAuthProvider | null {
    return this.currentProvider
  }

  /**
   * Set the current active provider
   */
  setCurrentProvider(provider: IAuthProvider): void {
    this.currentProvider = provider
  }

  /**
   * Get provider by type
   */
  getProvider(type: 'supabase' | 'mock'): IAuthProvider | null {
    for (const [key, provider] of this.providers) {
      if (key.startsWith(type)) {
        return provider
      }
    }
    return null
  }

  /**
   * Clear all providers
   */
  clearProviders(): void {
    this.providers.clear()
    this.currentProvider = null
  }

  /**
   * Get or create default provider based on environment
   */
  getDefaultProvider(): IAuthProvider {
    // Check if we already have a default provider
    if (this.currentProvider) {
      return this.currentProvider
    }

    // Determine provider based on environment
    const isTest = process.env.NODE_ENV === 'test'
    const useMock = process.env.USE_MOCK_AUTH === 'true'

    const type = isTest || useMock ? 'mock' : 'supabase'
    const provider = this.createProvider(type)

    this.currentProvider = provider
    return provider
  }
}

/**
 * Export singleton factory instance
 */
export const authProviderFactory = AuthProviderFactory.getInstance()

/**
 * Export convenience function to get default provider
 */
export function getAuthProvider(): IAuthProvider {
  return authProviderFactory.getDefaultProvider()
}
