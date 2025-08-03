import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  fetchPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  assignPermissionToRole,
} from '../store/permissions-slice';
import { fetchModules } from '../store/modules-slice';
import { fetchRoles } from '../store/roles-slice';
import type { Permission } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Permissions: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { permissions = [], loading, error } = useSelector((state: RootState) => state.permissions);
  const { modules } = useSelector((state: RootState) => state.modules);
  const { roles } = useSelector((state: RootState) => state.roles);

  const [showForm, setShowForm] = useState(false);
  const [showRoleAssignment, setShowRoleAssignment] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [selectedPermissionId, setSelectedPermissionId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | string>('');
  const [formData, setFormData] = useState({
    action: '',
    moduleId: '',
  });

  const actionOptions = ['create', 'read', 'update', 'delete'];

  useEffect(() => {
    dispatch(fetchPermissions());
    // dispatch(fetchModules());
    // dispatch(fetchRoles());
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const permissionData = {
      action: formData.action,
      moduleId: Number(formData.moduleId),
    };

    try {
      if (editingPermission) {
        await dispatch(
          updatePermission({ id: editingPermission.id, data: permissionData })
        ).unwrap();
      } else {
        await dispatch(createPermission(permissionData)).unwrap();
      }
      resetForm();
      // Refresh permissions list
      dispatch(fetchPermissions());
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      action: permission.action,
      moduleId: permission.module.id.toString(), // Changed from permission.moduleId
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this permission?')) {
      try {
        await dispatch(deletePermission(id)).unwrap();
        // Refresh permissions list
        dispatch(fetchPermissions());
      } catch (error) {
        console.error('Error deleting permission:', error);
      }
    }
  };

  const handleAssignToRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPermissionId && selectedRoleId) {
      try {
        await dispatch(
          assignPermissionToRole({
            permissionId: selectedPermissionId,
            roleId: Number(selectedRoleId),
          })
        ).unwrap();
        setShowRoleAssignment(false);
        setSelectedPermissionId(null);
        setSelectedRoleId('');
        // Refresh permissions to show updated role assignments
        dispatch(fetchPermissions());
      } catch (error) {
        console.error('Error assigning permission to role:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ action: '', moduleId: '' });
    setEditingPermission(null);
    setShowForm(false);
  };

  const openRoleAssignment = (permissionId: number) => {
    setSelectedPermissionId(permissionId);
    setShowRoleAssignment(true);
  };

  // The getModuleName function (which you already have correctly):
  const getModuleName = (permission: Permission) => {
    return permission.module.name;
  };

  if (loading && permissions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center">
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Permissions</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Add Permission
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Permission Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl w-96 mx-4">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingPermission ? 'Edit Permission' : 'Add Permission'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Action</label>
                <select
                  name="action"
                  value={formData.action}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="" className="bg-gray-800">
                    Select an action
                  </option>
                  {actionOptions.map(action => (
                    <option key={action} value={action} className="bg-gray-800">
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Module</label>
                <select
                  name="moduleId"
                  value={formData.moduleId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="" className="bg-gray-800">
                    Select a module
                  </option>
                  {modules.map(module => (
                    <option key={module.id} value={module.id} className="bg-gray-800">
                      {module.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-white/10 text-white/70 hover:text-white hover:bg-white/20 px-4 py-2 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200"
                >
                  {editingPermission ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showRoleAssignment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl w-96 mx-4">
            <h3 className="text-xl font-bold text-white mb-6">Assign Permission to Role</h3>
            <form onSubmit={handleAssignToRole} className="space-y-6">
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">Select Role</label>
                <select
                  value={selectedRoleId}
                  onChange={e => setSelectedRoleId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="" className="bg-gray-800">
                    Select a role
                  </option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id} className="bg-gray-800">
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRoleAssignment(false)}
                  className="bg-white/10 text-white/70 hover:text-white hover:bg-white/20 px-4 py-2 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions List */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl overflow-hidden">
        {permissions.length > 0 ? (
          <div className="divide-y divide-white/10">
            {permissions.map(permission => (
              <div key={permission.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-bold">
                        {permission.action.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">
                        {permission.action.charAt(0).toUpperCase() + permission.action.slice(1)} on{' '}
                        {getModuleName(permission)}
                      </div>
                      <div className="text-white/70 text-sm">
                        Module: {getModuleName(permission)} | Action: {permission.action}
                      </div>
                      {permission.description && (
                        <div className="text-white/50 text-xs mt-1">{permission.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => openRoleAssignment(permission.id)}
                      className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors duration-200"
                    >
                      Assign to Role
                    </button>
                    <button
                      onClick={() => handleEdit(permission)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(permission.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {permission.roles && permission.roles.length > 0 && (
                  <div className="mt-4 ml-16">
                    <div className="text-xs text-white/50 mb-2">Assigned to roles:</div>
                    <div className="flex flex-wrap gap-2">
                      {permission.roles.map(role => (
                        <span
                          key={role.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-400/30"
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
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
            <p className="text-white/70 text-lg">No permissions found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Permissions;
