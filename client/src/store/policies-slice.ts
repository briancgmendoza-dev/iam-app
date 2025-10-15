import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { SimulateActionRequest } from '../types';
import { apiService } from '../services/api';

interface OpaMetrics {
  totalEvaluations: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  averageEvaluationTime: number;
  cacheHitRate: number;
  errorRate: number;
}

interface OpaStatus {
  initialized: boolean;
  timestamp: string;
  version: string;
  performance?: OpaMetrics;
  health?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      message?: string;
    }>;
  };
}

interface SimulationResult {
  allowed: boolean;
  requiredPermission?: string;
  user?: {
    id: number;
    username: string;
  };
  userPermissions?: Array<{
    id: number;
    action: string;
    module: {
      id: number;
      name: string;
    };
  }>;
  opaDetails?: {
    violations?: string[];
    denyReasons?: Array<{
      code: string;
      message: string;
      required: { module: string; action: string };
      user_permissions: any[];
    }>;
  };
}

interface BatchEvaluationRequest {
  requests: Array<{
    module: string;
    action: string;
    resourceId?: number;
  }>;
}

interface BatchEvaluationResult {
  results: Array<{
    module: string;
    action: string;
    resourceId?: number;
    allowed: boolean;
    cached?: boolean;
    evaluationTime?: number;
  }>;
  summary: {
    total: number;
    allowed: number;
    denied: number;
    cached: number;
    totalTime: number;
  };
}

interface PoliciesState {
  status: OpaStatus | null;
  simulationResult: SimulationResult | null;
  batchResults: BatchEvaluationResult | null;
  loading: {
    status: boolean;
    simulation: boolean;
    batch: boolean;
  };
  error: string | null;
  lastStatusFetch: number;
  cacheMetrics: {
    hitRate: number;
    totalRequests: number;
  };
}

const initialState: PoliciesState = {
  status: null,
  simulationResult: null,
  batchResults: null,
  loading: {
    status: false,
    simulation: false,
    batch: false,
  },
  error: null,
  lastStatusFetch: 0,
  cacheMetrics: {
    hitRate: 0,
    totalRequests: 0,
  },
};

// Cache duration for OPA status (5 minutes)
const STATUS_CACHE_DURATION = 5 * 60 * 1000;

/**
 * Fetch OPA service status with intelligent caching
 */
export const fetchOpaStatus = createAsyncThunk(
  'policies/fetchStatus',
  async (force: boolean = false, { getState }) => {
    try {
      const state = getState() as { policies: PoliciesState };
      const now = Date.now();

      // Check if we have cached data that's still valid
      if (!force && state.policies.status &&
          (now - state.policies.lastStatusFetch) < STATUS_CACHE_DURATION) {
        return {
          status: state.policies.status,
          cached: true,
          timestamp: state.policies.lastStatusFetch,
        };
      }

      // Try detailed status first (requires authentication)
      let detailedData: OpaStatus | null = null;
      try {
        const statusResponse = await apiService.get<any>('policies/status');
        console.log('📊 OPA Status Response:', statusResponse);

        // Transform the response to match our expected structure
        detailedData = {
          initialized: statusResponse.service?.initialized || false,
          version: statusResponse.service?.version || 'Unknown',
          timestamp: statusResponse.service?.timestamp || new Date().toISOString(),
          performance: statusResponse.performance,
          health: statusResponse.health,
        };
      } catch (detailedError: any) {
        console.debug('Detailed status unavailable:', detailedError?.response?.status);

        // Fallback to public health endpoint
        if (detailedError?.response?.status === 401 || detailedError?.response?.status === 403) {
          console.debug('Falling back to health endpoint');
        }
      }

      // Fallback to health endpoint if detailed status failed
      if (!detailedData) {
        const healthData = await apiService.get<any>('policies/health');
        console.log('🏥 OPA Health Response:', healthData);

        detailedData = {
          initialized: healthData.initialized || healthData.service?.initialized || false,
          version: healthData.version || healthData.service?.version || 'Unknown',
          timestamp: healthData.timestamp || healthData.service?.timestamp || new Date().toISOString(),
          performance: healthData.performance,
          health: healthData.health,
        };
      }

      return {
        status: detailedData,
        cached: false,
        timestamp: now,
      };
    } catch (error: any) {
      console.warn('Could not fetch OPA status:', error);

      // Return a default status rather than failing completely
      return {
        status: {
          initialized: false,
          version: 'Unknown',
          timestamp: new Date().toISOString(),
          health: {
            status: 'unhealthy' as const,
            checks: [
              {
                name: 'connection',
                status: 'fail' as const,
                message: 'Unable to connect to OPA service',
              },
            ],
          },
        },
        cached: false,
        timestamp: Date.now(),
      };
    }
  }
);

/**
 * Simulate an action with enhanced error handling and caching awareness
 */
export const simulateAction = createAsyncThunk(
  'policies/simulateAction',
  async (actionData: SimulateActionRequest, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const userId = Number(state.auth.user?.id);

      if (!userId || isNaN(userId)) {
        return rejectWithValue('User not authenticated or invalid user ID');
      }

      const response = await apiService.post<SimulationResult>('simulate-action', {
        ...actionData,
        userId,
      });

      return {
        ...response,
        requestData: actionData,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to simulate action';
      return rejectWithValue(message);
    }
  }
);

/**
 * Batch evaluate multiple actions for performance
 */
export const batchEvaluateActions = createAsyncThunk(
  'policies/batchEvaluate',
  async (batchRequest: BatchEvaluationRequest, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const userId = Number(state.auth.user?.id);

      if (!userId || isNaN(userId)) {
        return rejectWithValue('User not authenticated or invalid user ID');
      }

      if (batchRequest.requests.length === 0) {
        return rejectWithValue('No requests provided for batch evaluation');
      }

      if (batchRequest.requests.length > 100) {
        return rejectWithValue('Batch size exceeds maximum of 100 requests');
      }

      // Create individual simulation calls instead of batch endpoint for now
      const results = [];
      let allowedCount = 0;
      let totalTime = 0;

      for (const request of batchRequest.requests) {
        try {
          const startTime = Date.now();
          const response = await apiService.post<SimulationResult>('simulate-action', {
            module: request.module,
            action: request.action,
            userId,
          });
          const evaluationTime = Date.now() - startTime;
          totalTime += evaluationTime;

          results.push({
            module: request.module,
            action: request.action,
            resourceId: request.resourceId,
            allowed: response.allowed,
            evaluationTime,
          });

          if (response.allowed) allowedCount++;
        } catch (error) {
          results.push({
            module: request.module,
            action: request.action,
            resourceId: request.resourceId,
            allowed: false,
            evaluationTime: 0,
          });
        }
      }

      return {
        results,
        summary: {
          total: results.length,
          allowed: allowedCount,
          denied: results.length - allowedCount,
          cached: 0,
          totalTime,
        },
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to batch evaluate actions';
      return rejectWithValue(message);
    }
  }
);

/**
 * Clear OPA cache (admin only)
 */
export const clearOpaCache = createAsyncThunk(
  'policies/clearCache',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.post('policies/clear-cache');
      return { cleared: true, timestamp: Date.now() };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to clear cache';
      return rejectWithValue(message);
    }
  }
);

/**
 * Get detailed metrics (admin only)
 */
export const fetchDetailedMetrics = createAsyncThunk(
  'policies/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<OpaMetrics>('policies/metrics');
      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch metrics';
      return rejectWithValue(message);
    }
  }
);

const policiesSlice = createSlice({
  name: 'policies',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSimulationResult: (state) => {
      state.simulationResult = null;
    },
    clearBatchResults: (state) => {
      state.batchResults = null;
    },
    updateCacheMetrics: (state, action) => {
      const { hitRate, totalRequests } = action.payload;
      state.cacheMetrics.hitRate = hitRate;
      state.cacheMetrics.totalRequests = totalRequests;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch OPA Status
      .addCase(fetchOpaStatus.pending, (state) => {
        state.loading.status = true;
        state.error = null;
      })
      .addCase(fetchOpaStatus.fulfilled, (state, action) => {
        state.loading.status = false;
        state.status = action.payload.status;
        if (!action.payload.cached) {
          state.lastStatusFetch = action.payload.timestamp;
        }

        // Update cache metrics if available
        if (action.payload.status.performance) {
          const perf = action.payload.status.performance;
          state.cacheMetrics.hitRate = perf.cacheHitRate;
          state.cacheMetrics.totalRequests = perf.totalEvaluations;
        }
      })
      .addCase(fetchOpaStatus.rejected, (state, action) => {
        state.loading.status = false;
        state.error = action.payload as string;
      })

      // Simulate Action
      .addCase(simulateAction.pending, (state) => {
        state.loading.simulation = true;
        state.error = null;
      })
      .addCase(simulateAction.fulfilled, (state, action) => {
        state.loading.simulation = false;
        state.simulationResult = action.payload;
      })
      .addCase(simulateAction.rejected, (state, action) => {
        state.loading.simulation = false;
        state.error = action.payload as string;
      })

      // Batch Evaluate
      .addCase(batchEvaluateActions.pending, (state) => {
        state.loading.batch = true;
        state.error = null;
      })
      .addCase(batchEvaluateActions.fulfilled, (state, action) => {
        state.loading.batch = false;
        state.batchResults = action.payload;
      })
      .addCase(batchEvaluateActions.rejected, (state, action) => {
        state.loading.batch = false;
        state.error = action.payload as string;
      })

      // Clear Cache
      .addCase(clearOpaCache.fulfilled, (state) => {
        // Reset cache metrics
        state.cacheMetrics.hitRate = 0;
        state.cacheMetrics.totalRequests = 0;
      })

      // Fetch Detailed Metrics
      .addCase(fetchDetailedMetrics.fulfilled, (state, action) => {
        if (state.status) {
          state.status.performance = action.payload;
          state.cacheMetrics.hitRate = action.payload.cacheHitRate;
          state.cacheMetrics.totalRequests = action.payload.totalEvaluations;
        }
      });
  },
});

export const {
  clearError,
  clearSimulationResult,
  clearBatchResults,
  updateCacheMetrics
} = policiesSlice.actions;

export default policiesSlice.reducer;
