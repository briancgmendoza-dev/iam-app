import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  assignUserToGroup,
} from '../store/groups-slice';
import { fetchUsers } from '../store/users-slice';
import type { Group } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Groups: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { groups = [], loading, error } = useSelector((state: RootState) => state.groups);
  const { users } = useSelector((state: RootState) => state.users);

  const [showForm, setShowForm] = useState(false);
  const [showUserAssignment, setShowUserAssignment] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    dispatch(fetchGroups());
    // dispatch(fetchUsers());
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingGroup) {
      await dispatch(updateGroup({ id: editingGroup.id, data: formData }));
    } else {
      await dispatch(createGroup(formData));
    }

    resetForm();
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      await dispatch(deleteGroup(id));
    }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroupId && selectedUserId) {
      await dispatch(assignUserToGroup({ groupId: selectedGroupId, userId: selectedUserId }));
      setShowUserAssignment(false);
      setSelectedGroupId(null);
      setSelectedUserId(null);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingGroup(null);
    setShowForm(false);
  };

  const openUserAssignment = (groupId: number) => {
    setSelectedGroupId(groupId);
    setShowUserAssignment(true);
  };

  if (loading && groups.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Group
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Group Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingGroup ? 'Edit Group' : 'Add Group'}
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
                  {editingGroup ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Assignment Modal */}
      {showUserAssignment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Assign User to Group</h3>
            <form onSubmit={handleAssignUser} className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                  Select User
                </label>
                <select
                  id="userId"
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(Number(e.target.value))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserAssignment(false)}
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

      {/* Groups Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {groups.map(group => (
            <li key={group.id}>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {group.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{group.name}</div>
                      <div className="text-sm text-gray-500">{group.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openUserAssignment(group.id)}
                      className="text-green-600 hover:text-green-900 text-sm font-medium"
                    >
                      Assign User
                    </button>
                    <button
                      onClick={() => handleEdit(group)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {group.users && group.users.length > 0 && (
                  <div className="mt-2 ml-14">
                    <div className="text-xs text-gray-500">Users:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {group.users.map(user => (
                        <span
                          key={user.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {user.username}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        {groups.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No groups found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
