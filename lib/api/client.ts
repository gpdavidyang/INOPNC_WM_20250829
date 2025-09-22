/**
 * Type-safe API client with automatic error handling and retry logic
 */


export interface ApiClientConfig {
  baseURL?: string
  timeout?: number
  retries?: number
  retryDelay?: number
  headers?: Record<string, string>
}

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  timeout?: number
  retries?: number
}

class ApiClient {
  private baseURL: string
  private timeout: number
  private retries: number
  private retryDelay: number
  private defaultHeaders: Record<string, string>

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || '/api'
    this.timeout = config.timeout || 30000
    this.retries = config.retries || 3
    this.retryDelay = config.retryDelay || 1000
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers
    }
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`)
      }
      throw error
    }
  }

  private async retryRequest(
    url: string,
    config: RequestInit,
    retries: number
  ): Promise<Response> {
    let lastError: Error | null = null

    for (let i = 0; i <= retries; i++) {
      try {
        return await this.fetchWithTimeout(url, config, this.timeout)
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on client errors (4xx)
        if (error instanceof Error && error.message.includes('4')) {
          throw error
        }

        // Wait before retrying (exponential backoff)
        if (i < retries) {
          await new Promise(resolve => 
            setTimeout(resolve, this.retryDelay * Math.pow(2, i))
          )
        }
      }
    }

    throw lastError || new Error('Request failed after retries')
  }

  private buildURL(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(
      endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`,
      window.location.origin
    )

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type')
    
    let data: unknown = null
    let error: string | null = null

    if (contentType?.includes('application/json')) {
      try {
        const json = await response.json()
        
        // Handle standard API response format
        if ('data' in json || 'error' in json) {
          return {
            data: json.data || null,
            error: json.error || null,
            message: json.message,
            status: response.status,
            success: response.ok && !json.error
          }
        }
        
        // Handle raw JSON response
        data = json
      } catch (e) {
        error = 'Invalid JSON response'
      }
    } else if (contentType?.includes('text/')) {
      data = await response.text()
    } else {
      data = await response.blob()
    }

    if (!response.ok) {
      error = error || `HTTP ${response.status}: ${response.statusText}`
    }

    return {
      data: data as T,
      error,
      status: response.status,
      success: response.ok && !error,
      message: response.statusText
    }
  }

  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { params, timeout, retries, ...fetchConfig } = config

    const url = this.buildURL(endpoint, params)
    
    const finalConfig: RequestInit = {
      ...fetchConfig,
      headers: {
        ...this.defaultHeaders,
        ...(fetchConfig.headers as Record<string, string>)
      }
    }

    // Add body for non-GET requests
    if (fetchConfig.body && typeof fetchConfig.body === 'object') {
      finalConfig.body = JSON.stringify(fetchConfig.body)
    }

    try {
      const response = await this.retryRequest(
        url,
        finalConfig,
        retries ?? this.retries
      )

      return await this.handleResponse<T>(response)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return {
        data: null as T,
        error: errorMessage,
        status: 0,
        success: false,
        message: errorMessage
      }
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  async post<T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'POST', 
      body: body as BodyInit,
      params 
    })
  }

  async put<T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'PUT', 
      body: body as BodyInit,
      params 
    })
  }

  async patch<T>(endpoint: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'PATCH', 
      body: body as BodyInit,
      params 
    })
  }

  async delete<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', params })
  }

  // Special methods for common patterns
  async getPaginated<T>(
    endpoint: string,
    page: number = 1,
    limit: number = 20,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    return this.request<PaginatedResponse<T>>(endpoint, {
      method: 'GET',
      params: {
        ...params,
        page,
        limit
      }
    })
  }

  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set it with boundary
      }
    })
  }

  async download(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<Blob | null> {
    const response = await this.request<Blob>(endpoint, {
      method: 'GET',
      params,
      headers: {
        Accept: 'application/octet-stream'
      }
    })

    return response.success ? response.data : null
  }
}

// Create singleton instance
const apiClient = new ApiClient()

// Export both the class and the instance
export { ApiClient }
export default apiClient

// Type-safe API hooks
export function createApiHook<TParams, TResponse>(
  fetcher: (params: TParams) => Promise<ApiResponse<TResponse>>
) {
  return function useApi(params: TParams) {
    const [data, setData] = React.useState<TResponse | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const execute = React.useCallback(async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetcher(params)
        
        if (response.success) {
          setData(response.data)
        } else {
          setError(response.error || 'Unknown error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }, [params])

    React.useEffect(() => {
      execute()
    }, [execute])

    return {
      data,
      loading,
      error,
      refetch: execute
    }
  }
}

// Export React for the hook
import * as React from 'react'