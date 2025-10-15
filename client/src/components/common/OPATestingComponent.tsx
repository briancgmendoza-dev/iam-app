import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { simulateAction } from '../../store/permissions-slice';
import { apiService } from '../../services/api';

interface OPATestResult {
  allowed: boolean;
  auditLog?: any;
  error?: string;
}

interface OPAHealthCheck {
  status: string;
  timestamp: string;
  error?: string;
}

const OPATestingComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [testForm, setTestForm] = useState({
    module: '',
    action: '',
    resourceId: '',
  });
  const [testResult, setTestResult] = useState<OPATestResult | null>(null);
  const [healthStatus, setHealthStatus] = useState<OPAHealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'test' | 'health' | 'examples'>('test');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTestForm({
      ...testForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTestResult(null);

    try {
      const result = await dispatch(simulateAction({
        module: testForm.module,
        action: testForm.action,
      }));

      if (result.type === 'permissions/simulateAction/fulfilled') {
        setTestResult({ allowed: (result.payload as any).allowed });
      } else {
        setTestResult({
          allowed: false,
          error: result.payload as string || 'Test failed'
        });
      }
    } catch (error) {
      setTestResult({
        allowed: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkOPAHealth = async () => {
    setLoading(true);
    setHealthStatus(null);

    try {
      const response = await apiService.get<{status: string, timestamp: string}>('/opa/health');
      setHealthStatus({
        status: response.status,
        timestamp: response.timestamp,
      });
    } catch (error: any) {
      setHealthStatus({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.response?.data?.error || error.message || 'Health check failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const runExampleTest = async (module: string, action: string) => {
    setTestForm({ module, action, resourceId: '' });
    setLoading(true);

    try {
      const result = await dispatch(simulateAction({ module, action }));
      if (result.type === 'permissions/simulateAction/fulfilled') {
        setTestResult({ allowed: (result.payload as any).allowed });
      }
    } catch (error) {
      setTestResult({
        allowed: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    { module: 'Users', action: 'read', description: 'Read users list' },
    { module: 'Users', action: 'create', description: 'Create new user' },
    { module: 'Groups', action: 'update', description: 'Update group' },
    { module: 'Roles', action: 'delete', description: 'Delete role' },
    { module: 'InvalidModule', action: 'read', description: 'Test access to non-existent module' },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">OPA Integration Testing</h2>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
        {(['test', 'health', 'examples'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Permission Test Tab */}
      {activeTab === 'test' && (
        <div className="space-y-4">
          <form onSubmit={handleTestSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Module</label>
                <select
                  name="module"
                  value={testForm.module}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  style={{ colorScheme: 'dark' }}
                  required
                >
                  <option value="" className="bg-gray-800 text-white">Select Module</option>
                  <option value="Users" className="bg-gray-800 text-white">Users</option>
                  <option value="Groups" className="bg-gray-800 text-white">Groups</option>
                  <option value="Roles" className="bg-gray-800 text-white">Roles</option>
                  <option value="Modules" className="bg-gray-800 text-white">Modules</option>
                  <option value="Permissions" className="bg-gray-800 text-white">Permissions</option>
                  <option value="System" className="bg-gray-800 text-white">System</option>
                </select>
              </div>

              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Action</label>
                <select
                  name="action"
                  value={testForm.action}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  style={{ colorScheme: 'dark' }}
                  required
                >
                  <option value="" className="bg-gray-800 text-white">Select Action</option>
                  <option value="create" className="bg-gray-800 text-white">Create</option>
                  <option value="read" className="bg-gray-800 text-white">Read</option>
                  <option value="update" className="bg-gray-800 text-white">Update</option>
                  <option value="delete" className="bg-gray-800 text-white">Delete</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Resource ID (Optional)
              </label>
              <input
                type="text"
                name="resourceId"
                value={testForm.resourceId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="e.g., 1, 2, 3..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:scale-100 transition-all duration-200"
            >
              {loading ? 'Testing...' : 'Test OPA Permission'}
            </button>
          </form>
        </div>
      )}

      {/* Health Check Tab */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-white/70 mb-4">Check the health status of the OPA service</p>
            <button
              onClick={checkOPAHealth}
              disabled={loading}
              className="py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:scale-100 transition-all duration-200"
            >
              {loading ? 'Checking...' : 'Check OPA Health'}
            </button>
          </div>

          {healthStatus && (
            <div className={`p-4 rounded-xl border backdrop-blur-sm ${
              healthStatus.status === 'OPA is healthy'
                ? 'bg-green-500/20 border-green-400/30'
                : 'bg-red-500/20 border-red-400/30'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  healthStatus.status === 'OPA is healthy' ? 'bg-green-400/20' : 'bg-red-400/20'
                }`}>
                  {healthStatus.status === 'OPA is healthy' ? (
                    <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-medium text-white">
                    {healthStatus.status}
                  </p>
                  <p className="text-sm text-white/70">
                    Checked at: {new Date(healthStatus.timestamp).toLocaleString()}
                  </p>
                  {healthStatus.error && (
                    <p className="text-sm text-red-300 mt-1">
                      Error: {healthStatus.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Examples Tab */}
      {activeTab === 'examples' && (
        <div className="space-y-4">
          <p className="text-white/70 mb-4">
            Click on any example to test different permission scenarios:
          </p>

          <div className="grid grid-cols-1 gap-3">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => runExampleTest(example.module, example.action)}
                disabled={loading}
                className="p-4 text-left bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      {example.action.toUpperCase()} {example.module}
                    </p>
                    <p className="text-sm text-white/70">{example.description}</p>
                  </div>
                  <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className="mt-6">
          <div className={`p-4 rounded-xl border backdrop-blur-sm ${
            testResult.allowed
              ? 'bg-green-500/20 border-green-400/30'
              : 'bg-red-500/20 border-red-400/30'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                testResult.allowed ? 'bg-green-400/20' : 'bg-red-400/20'
              }`}>
                {testResult.allowed ? (
                  <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-white">
                  OPA Decision: {testResult.allowed ? 'ALLOWED' : 'DENIED'}
                </p>
                <p className="text-sm text-white/70">
                  {testForm.action} on {testForm.module} is {testResult.allowed ? 'permitted' : 'not permitted'}
                </p>
                {testResult.error && (
                  <p className="text-sm text-red-300 mt-1">
                    Error: {testResult.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OPATestingComponent;
