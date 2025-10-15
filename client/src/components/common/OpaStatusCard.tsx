import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { fetchOpaStatus, clearOpaCache } from '../../store/policies-slice';

interface OpaStatusCardProps {
  showAdminControls?: boolean;
  onBatchTest?: () => void;
}

const OpaStatusCard: React.FC<OpaStatusCardProps> = ({
  showAdminControls = false,
  onBatchTest
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    status,
    loading,
    cacheMetrics
  } = useSelector((state: RootState) => state.policies);

  // Force refresh on component mount if no status
  React.useEffect(() => {
    if (!status) {
      console.log('🔄 Force refreshing OPA status on component mount');
      dispatch(fetchOpaStatus(true));
    }
  }, [dispatch, status]);

  const handleRefresh = () => {
    dispatch(fetchOpaStatus(true));
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear the OPA cache? This may temporarily impact performance.')) {
      await dispatch(clearOpaCache());
      // Refresh status after clearing cache
      setTimeout(() => {
        dispatch(fetchOpaStatus(true));
      }, 1000);
    }
  };

  // Debug logging to see what status we're getting
  console.log('🔍 OPA Status in Component:', status);

  // Comprehensive logic for determining if OPA is active
  // Check multiple indicators to be more robust
  const isHealthy = Boolean(status && (
    status.initialized ||                                    // Direct initialized flag
    status.health?.status === 'healthy' ||                  // Health check says healthy
    (status.performance && status.performance.totalEvaluations > 0) || // Has performed evaluations
    (status.version && status.version !== 'Unknown')        // Has valid version info
  ));

  console.log('✅ Is Healthy Calculated:', isHealthy, {
    initialized: status?.initialized,
    healthStatus: status?.health?.status,
    hasEvaluations: status?.performance?.totalEvaluations,
    version: status?.version
  });

  const cacheHitRate = status?.performance?.cacheHitRate || 0;
  const totalEvaluations = cacheMetrics.totalRequests || status?.performance?.totalEvaluations || 0;
  const avgResponseTime = status?.performance?.averageEvaluationTime || 0;

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">OPA Policy Engine</h2>
            {status?.performance && (
              <p className="text-sm text-white/60">
                {totalEvaluations.toLocaleString()} evaluations • {Math.round(avgResponseTime)}ms avg
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Admin Controls */}
          {showAdminControls && (
            <>
              {onBatchTest && (
                <button
                  onClick={onBatchTest}
                  disabled={loading.batch}
                  className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  Batch Test
                </button>
              )}
              <button
                onClick={handleClearCache}
                disabled={loading.status}
                className="px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/30 text-orange-300 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                Clear Cache
              </button>
            </>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading.status}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 disabled:opacity-50"
            title="Refresh Status"
          >
            <svg className={`w-4 h-4 text-white ${loading.status ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isHealthy
              ? 'bg-green-400/20 text-green-300 border border-green-400/30'
              : 'bg-red-400/20 text-red-300 border border-red-400/30'
          }`}>
            {isHealthy ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Status Metrics */}
      {status && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-white/70 mb-1">Version</p>
            <p className="text-white font-medium">{status.version || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-white/70 mb-1">Cache Hit Rate</p>
            <p className="text-white font-medium">
              {Math.round(cacheHitRate * 100)}%
            </p>
          </div>
          <div>
            <p className="text-white/70 mb-1">Total Evaluations</p>
            <p className="text-white font-medium">
              {totalEvaluations.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-white/70 mb-1">Health Status</p>
            <p className={`font-medium capitalize ${
              status.health?.status === 'healthy' ? 'text-green-300' :
              status.health?.status === 'degraded' ? 'text-yellow-300' : 'text-red-300'
            }`}>
              {status.health?.status || 'Unknown'}
            </p>
          </div>
        </div>
      )}

      {/* Performance Warning */}
      {status?.performance && status.performance.errorRate > 0.1 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-yellow-300 text-sm">
              High error rate detected: {Math.round(status.performance.errorRate * 100)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpaStatusCard;
