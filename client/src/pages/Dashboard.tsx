import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchUserPermissions, simulateAction } from '../store/permissions-slice';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { userPermissions = [], loading } = useSelector((state: RootState) => state.permissions);

  const [simulationForm, setSimulationForm] = useState({
    module: '',
    action: '',
  });
  const [simulationResult, setSimulationResult] = useState<{ allowed: boolean } | null>(null);

  useEffect(() => {
    // console.log('@@@ user in Dashboard:', user);
    if (!user) return;
    dispatch(fetchUserPermissions(user.id));
  }, [dispatch, user]);

  // useEffect(() => {
  //   console.log('@@@ userPermissions:', userPermissions);
  //   if (userPermissions.length > 0) {
  //     console.log('@@@ first permission:', userPermissions[0]);
  //   }
  // }, [userPermissions]);

  const handleSimulationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(simulateAction(simulationForm));
    if (result.type === 'permissions/simulateAction/fulfilled') {
      setSimulationResult({ allowed: (result.payload as any).allowed });
    }
  };

  const handleSimulationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSimulationForm({
      ...simulationForm,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            <p className="text-white/70">Manage your IAM system with ease</p>
          </div>
        </div>
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
                  key={permission.id}
                  className="p-4 rounded-xl border backdrop-blur-sm bg-blue-500/20 border-blue-400/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">
                      {permission.action} on {permission.module.name}
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

        {/* Action Simulation Card */}
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
            <h2 className="text-xl font-semibold text-white">Simulate Action</h2>
          </div>

          <form onSubmit={handleSimulationSubmit} className="space-y-4">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Module</label>
              <input
                type="text"
                name="module"
                value={simulationForm.module}
                onChange={handleSimulationInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                placeholder="e.g., Users"
                required
              />
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">Action</label>
              <input
                type="text"
                name="action"
                value={simulationForm.action}
                onChange={handleSimulationInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                placeholder="e.g., create"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              Test Permission
            </button>
          </form>

          {simulationResult && (
            <div className="mt-6">
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
                      Action {simulationResult.allowed ? 'Allowed' : 'Denied'}
                    </p>
                    <p className="text-sm text-white/70">
                      {simulationForm.action} on {simulationForm.module} is{' '}
                      {simulationResult.allowed ? 'permitted' : 'not permitted'} for your user.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
