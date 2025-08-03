import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Role, ApiResponse } from '../types';
import { apiService } from '../services/api';

interface RolesState {
  roles: Role[];
  loading: boolean;
  error: string | null;
}

const initialState: RolesState = {
  roles: [],
  loading: false,
  error: null,
};

export const fetchRoles = createAsyncThunk('roles/fetchRoles', async (_, { rejectWithValue }) => {
  try {
    const response = await apiService.get<ApiResponse<Role[]>>('roles');
    return response;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch roles');
  }
});

export const createRole = createAsyncThunk(
  'roles/createRole',
  async (roleData: Partial<Role>, { rejectWithValue }) => {
    try {
      const response = await apiService.post<ApiResponse<Role>>('/roles', roleData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create role');
    }
  }
);

export const updateRole = createAsyncThunk(
  'roles/updateRole',
  async ({ id, data }: { id: number; data: Partial<Role> }, { rejectWithValue }) => {
    try {
      const response = await apiService.put<ApiResponse<Role>>(`/roles/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update role');
    }
  }
);

export const deleteRole = createAsyncThunk(
  'roles/deleteRole',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiService.delete(`/roles/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete role');
    }
  }
);

export const assignRoleToGroup = createAsyncThunk(
  'roles/assignRoleToGroup',
  async ({ groupId, roleId }: { groupId: number; roleId: number }, { rejectWithValue }) => {
    try {
      await apiService.post(`/groups/${groupId}/roles`, { roleId });
      return { groupId, roleId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to assign role to group');
    }
  }
);

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchRoles.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.roles.push(action.payload);
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        const index = state.roles.findIndex(role => role.id === action.payload.id);
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.roles = state.roles.filter(role => role.id !== action.payload);
      });
  },
});

export const { clearError } = rolesSlice.actions;
export default rolesSlice.reducer;
