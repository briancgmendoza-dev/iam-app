import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { simulateAction, clearSimulationResult } from '../../store/policies-slice';

interface PolicySimulationFormProps {
  onResult?: (result: any) => void;
  moduleOptions?: string[];
  actionOptions?: string[];
}

const PolicySimulationForm: React.FC<PolicySimulationFormProps> = ({
  onResult,
  moduleOptions = ['Users', 'Groups', 'Roles', 'Permissions', 'Modules'],
  actionOptions = ['create', 'read', 'update', 'delete'],
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { simulationResult, loading } = useSelector((state: RootState) => state.policies);

  const [form, setForm] = useState({
    module: '',
    action: '',
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.module || !form.action) {
      return;
    }

    // Clear previous result
    dispatch(clearSimulationResult());

    // Submit new simulation
    const result = await dispatch(simulateAction({ module: form.module, action: form.action }));

    if (onResult && result.type.endsWith('/fulfilled')) {
      onResult(result.payload);
    }
  }, [dispatch, form, onResult]);  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }, [form]);

  const resetForm = useCallback(() => {
    setForm({ module: '', action: '' });
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
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

        {(form.module || form.action) && (
          <button
            onClick={resetForm}
            className="text-white/60 hover:text-white/80 text-sm transition-colors"
          >
            Clear Form
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white/90 text-sm font-medium mb-2">Module</label>
          <select
            name="module"
            value={form.module}
            onChange={handleInputChange}
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
            value={form.action}
            onChange={handleInputChange}
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
          disabled={loading.simulation || !form.module || !form.action}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:transform-none disabled:opacity-50"
        >
          {loading.simulation ? (
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

      {/* Results */}
      {simulationResult && (
        <div className="mt-6 space-y-4">
          {/* Result Summary */}
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
                  {form.action} on {form.module} is{' '}
                  {simulationResult.allowed ? 'permitted' : 'denied'} by OPA
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {simulationResult.opaDetails && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-3">🔒 OPA Policy Details</h4>

              {simulationResult.opaDetails.violations && simulationResult.opaDetails.violations.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-red-300 mb-2">Policy Violations:</p>
                  {simulationResult.opaDetails.violations.map((violation: string, index: number) => (
                    <p key={index} className="text-xs text-red-200 bg-red-500/10 rounded px-2 py-1 mb-1">
                      {violation}
                    </p>
                  ))}
                </div>
              )}

              {simulationResult.opaDetails.denyReasons && simulationResult.opaDetails.denyReasons.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-orange-300 mb-2">Denial Analysis:</p>
                  {simulationResult.opaDetails.denyReasons.map((reason: any, index: number) => (
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
  );
};

export default PolicySimulationForm;
