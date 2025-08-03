import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRoleToGroup,
} from '../store/roles-slice';
import { fetchGroups } from '../store/groups-slice';
import type { Role } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Roles: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { roles = [], loading, error } = useSelector((state: RootState) => state.roles);
  const { groups } = useSelector((state: RootState) => state.groups);

  const [showForm, setShowForm] = useState(false);
  const [showGroupAssignment, setShowGroupAssignment] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    dispatch(fetchRoles());
    // dispatch(fetchGroups());
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRole) {
      await dispatch(updateRole({ id: editingRole.id, data: formData }));
    } else {
      await dispatch(createRole(formData));
    }

    resetForm();
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      await dispatch(deleteRole(id));
    }
  };

  const handleAssignToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoleId && selectedGroupId) {
      await dispatch(
        assignRoleToGroup({ roleId: selectedRoleId, groupId: Number(selectedGroupId) })
      );
      setShowGroupAssignment(false);
      setSelectedRoleId(null);
      setSelectedGroupId('');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingRole(null);
    setShowForm(false);
  };

  const openGroupAssignment = (roleId: number) => {
    setSelectedRoleId(roleId);
    setShowGroupAssignment(true);
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Role
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Role Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingRole ? 'Edit Role' : 'Add Role'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Assignment Modal */}
      {showGroupAssignment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Role to Group</h3>
            <form onSubmit={handleAssignToGroup} className="space-y-4">
              <div>
                <label htmlFor="groupId" className="block text-sm font-medium text-gray-700">
                  Select Group
                </label>
                <select
                  id="groupId"
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select a group</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGroupAssignment(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roles Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {roles.map(role => (
            <li key={role.id}>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-purple-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-700">
                          {role.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{role.name}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openGroupAssignment(role.id)}
                      className="text-green-600 hover:text-green-900 text-sm font-medium"
                    >
                      Assign to Group
                    </button>
                    <button
                      onClick={() => handleEdit(role)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {role.groups && role.groups.length > 0 && (
                  <div className="mt-2 ml-14">
                    <div className="text-xs text-gray-500">Assigned to groups:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {role.groups.map(group => (
                        <span
                          key={group.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {group.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        {roles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No roles found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;
