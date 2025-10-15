import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect } from 'react';
import type { RootState, AppDispatch } from '../store';
import {
  fetchOpaStatus,
  simulateAction,
  clearSimulationResult,
  clearError,
  batchEvaluateActions,
  clearOpaCache,
} from '../store/policies-slice';

/**
 * Custom hook for OPA policy operations
 * Provides optimized and consistent interface for policy-related actions
 */
export const usePolicies = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    status,
    simulationResult,
    batchResults,
    loading,
    error,
    cacheMetrics,
  } = useSelector((state: RootState) => state.policies);

  // Auto-refresh OPA status with intelligent caching
  const refreshStatus = useCallback((force = false) => {
    dispatch(fetchOpaStatus(force));
  }, [dispatch]);

  // Simulate a single action
  const testAction = useCallback(async (module: string, action: string) => {
    dispatch(clearSimulationResult());
    return dispatch(simulateAction({ module, action }));
  }, [dispatch]);

  // Batch test multiple actions
  const batchTest = useCallback(async (requests: Array<{ module: string; action: string; resourceId?: number }>) => {
    return dispatch(batchEvaluateActions({ requests }));
  }, [dispatch]);

  // Clear OPA cache (admin only)
  const clearCache = useCallback(async () => {
    await dispatch(clearOpaCache());
    // Refresh status after clearing cache
    setTimeout(() => {
      dispatch(fetchOpaStatus(true));
    }, 1000);
  }, [dispatch]);

  // Clear errors
  const clearErrors = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Clear simulation results
  const clearResults = useCallback(() => {
    dispatch(clearSimulationResult());
  }, [dispatch]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  return {
    // State
    status,
    simulationResult,
    batchResults,
    loading,
    error,
    cacheMetrics,

    // Actions
    refreshStatus,
    testAction,
    batchTest,
    clearCache,
    clearErrors,
    clearResults,

    // Computed values
    isHealthy: status?.initialized || false,
    cacheHitRate: status?.performance?.cacheHitRate || 0,
    totalEvaluations: cacheMetrics.totalRequests || 0,
    avgResponseTime: status?.performance?.averageEvaluationTime || 0,
  };
};

/**
 * Hook for common policy test scenarios
 */
export const usePolicyTests = () => {
  const { batchTest } = usePolicies();

  const runCommonTests = useCallback(async () => {
    const commonActions = [
      { module: 'Users', action: 'read' },
      { module: 'Users', action: 'create' },
      { module: 'Users', action: 'update' },
      { module: 'Groups', action: 'read' },
      { module: 'Roles', action: 'read' },
      { module: 'Permissions', action: 'read' },
    ];

    return batchTest(commonActions);
  }, [batchTest]);

  const runCrudTests = useCallback(async (module: string) => {
    const crudActions = [
      { module, action: 'create' },
      { module, action: 'read' },
      { module, action: 'update' },
      { module, action: 'delete' },
    ];

    return batchTest(crudActions);
  }, [batchTest]);

  return {
    runCommonTests,
    runCrudTests,
  };
};
