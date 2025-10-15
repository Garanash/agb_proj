/**
 * Хук для работы с API
 */

import { useState, useCallback } from 'react'
import { getApiEndpoint } from '@/utils/api'
import type { ApiResponse } from '@/types/index'

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: (endpoint: string, options?: RequestInit) => Promise<T | null>
  reset: () => void
}

export function useApi<T = any>(options?: UseApiOptions): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (endpoint: string, requestOptions?: RequestInit): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const url = getApiEndpoint(endpoint)
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...requestOptions?.headers,
        },
        ...requestOptions,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse<T> = await response.json()
      setData(result.data)
      
      if (options?.onSuccess) {
        options.onSuccess(result.data)
      }

      return result.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      
      if (options?.onError) {
        options.onError(error)
      }

      return null
    } finally {
      setLoading(false)
    }
  }, [options])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset,
  }
}
