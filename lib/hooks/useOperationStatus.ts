/**
 * Operation Status Hook
 * CONSTRUCTORA WM/M&S - "CONSTRUYENDO EL FUTURO"
 * 
 * Provides consistent loading states for CRUD operations
 * Prevents double-submission and provides user feedback
 */

import { useState, useCallback, useRef } from 'react';

export type OperationType = 'create' | 'read' | 'update' | 'delete' | 'sync';
export type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface OperationState {
  status: OperationStatus;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface UseOperationStatusOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  resetDelay?: number; // Delay in ms before resetting to idle after success
}

export function useOperationStatus(
  operationType: OperationType,
  options: UseOperationStatusOptions = {}
) {
  const [state, setState] = useState<OperationState>({
    status: 'idle',
    loading: false,
    error: null,
    success: false,
  });

  const operationRef = useRef<string | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      loading,
      status: loading ? 'loading' : 'idle',
    }));
  }, []);

  const setSuccess = useCallback(() => {
    setState({
      status: 'success',
      loading: false,
      error: null,
      success: true,
    });

    if (options.onSuccess) {
      options.onSuccess();
    }

    // Auto-reset after delay
    if (options.resetDelay) {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = setTimeout(() => {
        setState({
          status: 'idle',
          loading: false,
          error: null,
          success: false,
        });
      }, options.resetDelay);
    }
  }, [options.onSuccess, options.resetDelay]);

  const setError = useCallback((error: Error | string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    setState({
      status: 'error',
      loading: false,
      error: errorMessage,
      success: false,
    });

    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [options.onError]);

  const reset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    setState({
      status: 'idle',
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationId?: string
  ): Promise<T> => {
    // Prevent duplicate operations
    if (state.loading) {
      throw new Error(`Ya hay una operación de ${operationType} en progreso`);
    }

    if (operationId && operationRef.current === operationId) {
      throw new Error('Esta operación ya se está ejecutando');
    }

    operationRef.current = operationId || `${operationType}-${Date.now()}`;
    setLoading(true);

    try {
      const result = await operation();
      setSuccess();
      return result;
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      operationRef.current = null;
    }
  }, [operationType, state.loading, setLoading, setSuccess, setError]);

  return {
    ...state,
    setLoading,
    setSuccess,
    setError,
    reset,
    executeOperation,
    // Convenience methods
    isIdle: state.status === 'idle',
    isLoading: state.loading,
    isSuccess: state.success,
    hasError: !!state.error,
  };
}

/**
 * Hook for managing multiple concurrent operations
 */
export function useOperations() {
  const [operations, setOperations] = useState<Record<string, OperationState>>({});

  const startOperation = useCallback((id: string) => {
    setOperations(prev => ({
      ...prev,
      [id]: {
        status: 'loading',
        loading: true,
        error: null,
        success: false,
      },
    }));
  }, []);

  const completeOperation = useCallback((id: string, success: boolean, error?: string) => {
    setOperations(prev => ({
      ...prev,
      [id]: {
        status: success ? 'success' : 'error',
        loading: false,
        error: error || null,
        success,
      },
    }));
  }, []);

  const resetOperation = useCallback((id: string) => {
    setOperations(prev => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const isOperationLoading = useCallback((id: string) => {
    return operations[id]?.loading || false;
  }, [operations]);

  const hasOperationError = useCallback((id: string) => {
    return !!operations[id]?.error;
  }, [operations]);

  const isOperationSuccess = useCallback((id: string) => {
    return operations[id]?.success || false;
  }, [operations]);

  return {
    operations,
    startOperation,
    completeOperation,
    resetOperation,
    isOperationLoading,
    hasOperationError,
    isOperationSuccess,
  };
}

/**
 * Hook for optimistic updates
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFunction: (data: T) => Promise<T>
) {
  const [data, setData] = useState<T>(initialData);
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (updates: Partial<T> | ((prev: T) => T)) => {
    setIsOptimistic(true);
    setError(null);

    try {
      // Apply optimistic update
      const optimisticValue = typeof updates === 'function' 
        ? (updates as (prev: T) => T)(data)
        : { ...data, ...updates };
      
      setOptimisticData(optimisticValue);

      // Perform actual update
      const result = await updateFunction(optimisticValue);
      
      setData(result);
      setOptimisticData(null);
      setIsOptimistic(false);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setOptimisticData(null);
      setIsOptimistic(false);
      throw err;
    }
  }, [data, updateFunction]);

  const reset = useCallback(() => {
    setData(initialData);
    setOptimisticData(null);
    setIsOptimistic(false);
    setError(null);
  }, [initialData]);

  return {
    data: optimisticData || data,
    setData,
    update,
    reset,
    isOptimistic,
    error,
    isLoading: isOptimistic,
  };
}