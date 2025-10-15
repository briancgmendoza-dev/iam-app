import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchUserPermissions } from '../store/permissions-slice';
import {
  fetchOpaStatus,
  simulateAction,
  clearSimulationResult,
  clearError,
  batchEvaluateActions,
  clearOpaCache,
} from '../store/policies-slice';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { userPermissions = [], loading: permissionsLoading } = useSelector((state: RootState) => state.permissions);
  const {
    status: opaStatus,
    simulationResult,
    loading: policiesLoading,
    error: policiesError,
    cacheMetrics,
  } = useSelector((state: RootState) => state.policies);

  const [simulationForm, setSimulationForm] = useState({
    module: '',
    action: '',
  });

  // Auto-refresh OPA status every 30 seconds
  useEffect(() => {
    if (!user) return;

    // Initial data fetch
    dispatch(fetchUserPermissions(user.id));
    dispatch(fetchOpaStatus(false));

    // Set up auto-refresh for OPA status
    const interval = setInterval(() => {
      dispatch(fetchOpaStatus(false)); // Use cached data if available
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch, user]);

  // Clear errors after 5 seconds
  useEffect(() => {
    if (policiesError) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [policiesError, dispatch]);

  const handleSimulationSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!simulationForm.module || !simulationForm.action) {
      return;
    }

    // Clear previous result
    dispatch(clearSimulationResult());

    // Submit new simulation
    await dispatch(simulateAction(simulationForm));
  }, [dispatch, simulationForm]);

  const handleSimulationInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSimulationForm({
      ...simulationForm,
      [e.target.name]: e.target.value,
    });
  }, [simulationForm]);

  const handleRefreshStatus = useCallback(() => {
    dispatch(fetchOpaStatus(true)); // Force refresh
  }, [dispatch]);

  const handleClearCache = useCallback(async () => {
    if (confirm('Are you sure you want to clear the OPA cache? This may temporarily impact performance.')) {
      await dispatch(clearOpaCache());
      // Refresh status after clearing cache
      setTimeout(() => {
        dispatch(fetchOpaStatus(true));
      }, 1000);
    }
  }, [dispatch]);

  // Batch test common actions
  const handleBatchTest = useCallback(async () => {
    const commonActions = [
      { module: 'Users', action: 'read' },
      { module: 'Users', action: 'create' },
      { module: 'Users', action: 'update' },
      { module: 'Groups', action: 'read' },
      { module: 'Roles', action: 'read' },
    ];

    await dispatch(batchEvaluateActions({ requests: commonActions }));
  }, [dispatch]);

  const isAdmin = user?.username === 'admin';

  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Predefined module and action options
  const moduleOptions = ['Users', 'Groups', 'Roles', 'Permissions', 'Modules'];
  const actionOptions = ['create', 'read', 'update', 'delete'];

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {policiesError && (
        <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-300 text-sm">{policiesError}</p>
          </div>
        </div>
      )}

      {/* Welcome Card */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.username}!</h1>
              <p className="text-white/70">Manage your IAM system with ease</p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleBatchTest}
                disabled={policiesLoading.batch}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                Batch Test
              </button>
              <button
                onClick={handleClearCache}
                disabled={policiesLoading.status}
                className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-400/30 text-orange-300 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                Clear Cache
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced OPA Status Card */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">OPA Status</h2>
              {opaStatus?.performance && (
                <p className="text-sm text-white/60">
                  {opaStatus.performance.totalEvaluations} evaluations • {Math.round(opaStatus.performance.averageEvaluationTime)}ms avg
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefreshStatus}
              disabled={policiesLoading.status}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 disabled:opacity-50"
              title="Refresh Status"
            >
              <svg className={`w-4 h-4 text-white ${policiesLoading.status ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              opaStatus?.initialized
                ? 'bg-green-400/20 text-green-300 border border-green-400/30'
                : 'bg-red-400/20 text-red-300 border border-red-400/30'
            }`}>
              {opaStatus?.initialized ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        {opaStatus && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-white/70 mb-1">Version</p>
              <p className="text-white font-medium">{opaStatus.version || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-white/70 mb-1">Cache Hit Rate</p>
              <p className="text-white font-medium">
                {opaStatus.performance ? `${Math.round(opaStatus.performance.cacheHitRate * 100)}%` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-white/70 mb-1">Total Evaluations</p>
              <p className="text-white font-medium">
                {cacheMetrics.totalRequests.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-white/70 mb-1">Health Status</p>
              <p className={`font-medium capitalize ${
                opaStatus.health?.status === 'healthy' ? 'text-green-300' :
                opaStatus.health?.status === 'degraded' ? 'text-yellow-300' : 'text-red-300'
              }`}>
                {opaStatus.health?.status || 'Unknown'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Permissions Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Your Permissions</h2>
          </div>

          {userPermissions.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {userPermissions.map((permission, index) => (
                <div
                  key={`permission-${permission.id}-${index}`}
                  className="p-4 rounded-xl border backdrop-blur-sm bg-blue-500/20 border-blue-400/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">
                      {permission.action} on {permission.module?.name || 'Unknown'}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-400/20 text-blue-300 border border-blue-400/30">
                      Available
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <p className="text-white/70">No permissions found</p>
            </div>
          )}
        </div>

        {/* Enhanced Action Simulation Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">Test OPA Policies</h2>
          </div>

          <form onSubmit={handleSimulationSubmit} className="space-y-4">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Module</label>
              <select
                name="module"
                value={simulationForm.module}
                onChange={handleSimulationInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="" className="bg-gray-800 text-white">Select Module</option>
                {moduleOptions.map(module => (
                  <option key={module} value={module} className="bg-gray-800 text-white">
                    {module}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Action</label>
              <select
                name="action"
                value={simulationForm.action}
                onChange={handleSimulationInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                required
              >
                <option value="" className="bg-gray-800 text-white">Select Action</option>
                {actionOptions.map(action => (
                  <option key={action} value={action} className="bg-gray-800 text-white">
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={policiesLoading.simulation || !simulationForm.module || !simulationForm.action}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:transform-none disabled:opacity-50"
            >
              {policiesLoading.simulation ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Testing...</span>
                </div>
              ) : (
                'Test Policy Evaluation'
              )}
            </button>
          </form>

          {simulationResult && (
            <div className="mt-6 space-y-4">
              <div
                className={`p-4 rounded-xl border backdrop-blur-sm ${
                  simulationResult.allowed
                    ? 'bg-green-500/20 border-green-400/30'
                    : 'bg-red-500/20 border-red-400/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      simulationResult.allowed ? 'bg-green-400/20' : 'bg-red-400/20'
                    }`}
                  >
                    {simulationResult.allowed ? (
                      <svg
                        className="w-4 h-4 text-green-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-red-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      Policy {simulationResult.allowed ? 'ALLOWS' : 'DENIES'} Access
                    </p>
                    <p className="text-sm text-white/70">
                      {simulationForm.action} on {simulationForm.module} is{' '}
                      {simulationResult.allowed ? 'permitted' : 'denied'} by OPA
                    </p>
                  </div>
                </div>
              </div>

              {/* OPA Evaluation Details */}
              {simulationResult.opaDetails && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">🔒 OPA Policy Details</h4>

                  {simulationResult.opaDetails.violations && simulationResult.opaDetails.violations.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-red-300 mb-2">Policy Violations:</p>
                      {simulationResult.opaDetails.violations.map((violation, index) => (
                        <p key={index} className="text-xs text-red-200 bg-red-500/10 rounded px-2 py-1 mb-1">
                          {violation}
                        </p>
                      ))}
                    </div>
                  )}

                  {simulationResult.opaDetails.denyReasons && simulationResult.opaDetails.denyReasons.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-orange-300 mb-2">Denial Analysis:</p>
                      {simulationResult.opaDetails.denyReasons.map((reason, index) => (
                        <div key={index} className="text-xs bg-orange-500/10 rounded p-2">
                          <p className="text-orange-200 font-medium">{reason.code}: {reason.message}</p>
                          <p className="text-orange-300 mt-1">
                            Required: {reason.required.action} permission on {reason.required.module}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!simulationResult.opaDetails.violations || simulationResult.opaDetails.violations.length === 0) &&
                   (!simulationResult.opaDetails.denyReasons || simulationResult.opaDetails.denyReasons.length === 0) && (
                    <p className="text-xs text-green-300 bg-green-500/10 rounded px-2 py-1">
                      ✅ All OPA policy checks passed successfully
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
