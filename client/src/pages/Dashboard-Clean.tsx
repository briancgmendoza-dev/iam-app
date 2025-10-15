import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchUserPermissions } from '../store/permissions-slice';
import { usePolicies, usePolicyTests } from '../hooks/use-policies';
import LoadingSpinner from '../components/common/LoadingSpinner';
import OpaStatusCard from '../components/common/OpaStatusCard';
import PolicySimulationForm from '../components/common/PolicySimulationForm';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { userPermissions = [], loading: permissionsLoading } = useSelector((state: RootState) => state.permissions);
  const { refreshStatus, error: policiesError } = usePolicies();
  const { runCommonTests } = usePolicyTests();

  // Auto-refresh OPA status and fetch user permissions
  useEffect(() => {
    if (!user) return;

    // Initial data fetch
    dispatch(fetchUserPermissions(user.id));
    refreshStatus(false);

    // Set up auto-refresh for OPA status every 30 seconds
    const interval = setInterval(() => {
      refreshStatus(false); // Use cached data if available
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch, user, refreshStatus]);

  const isAdmin = user?.username === 'admin';

  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

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
            <p className="text-white/70">Manage your IAM system with optimized OPA policies</p>
          </div>
        </div>
      </div>

      {/* OPA Status Card */}
      <OpaStatusCard
        showAdminControls={isAdmin}
        onBatchTest={runCommonTests}
      />

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
            <div>
              <h2 className="text-xl font-semibold text-white">Your Permissions</h2>
              <p className="text-sm text-white/60">{userPermissions.length} permissions available</p>
            </div>
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

        {/* Policy Simulation Form */}
        <PolicySimulationForm />
      </div>
    </div>
  );
};

export default Dashboard;
