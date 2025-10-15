import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Permission, UserPermission, ApiResponse, SimulateActionRequest, SimulateActionResponse } from '../types';
import { apiService } from '../services/api';

interface PermissionsState {
  permissions: Permission[];
  userPermissions: UserPermission[];
  loading: boolean;
  error: string | null;
}

const initialState: PermissionsState = {
  permissions: [],
  userPermissions: [],
  loading: false,
  error: null,
};

export const fetchPermissions = createAsyncThunk(
  'permissions/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<ApiResponse<Permission[]>>('permissions');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch permissions');
    }
  }
);

export const createPermission = createAsyncThunk(
  'permissions/createPermission',
  async (permissionData: Partial<Permission>, { rejectWithValue }) => {
    try {
      const response = await apiService.post<ApiResponse<Permission>>(
        '/permissions',
        permissionData
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create permission');
    }
  }
);

export const updatePermission = createAsyncThunk(
  'permissions/updatePermission',
  async ({ id, data }: { id: number; data: Partial<Permission> }, { rejectWithValue }) => {
    try {
      const response = await apiService.put<ApiResponse<Permission>>(`/permissions/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update permission');
    }
  }
);

export const deletePermission = createAsyncThunk(
  'permissions/deletePermission',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiService.delete(`/permissions/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete permission');
    }
  }
);

export const fetchUserPermissions = createAsyncThunk(
  'permissions/fetchUserPermissions',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiService.post<ApiResponse<UserPermission[]>>(`/${id}/permissions`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user permissions');
    }
  }
);

export const simulateAction = createAsyncThunk(
  'permissions/simulateAction',
  async (actionData: SimulateActionRequest, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const userId = +state.auth.user?.id;

      if (!userId) {
        return rejectWithValue('User not authenticated');
      }


      if (isNaN(userId)) {
        return rejectWithValue('Invalid user ID');
      }

      const response = await apiService.post<SimulateActionResponse>(
        '/simulate-action',
        { ...actionData, userId }
      );

      return {
        ...actionData,
        allowed: response.allowed,
        requiredPermission: response.requiredPermission,
        user: response.user,
        userPermissions: response.userPermissions
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to simulate action');
    }
  }
);

export const assignPermissionToRole = createAsyncThunk(
  'permissions/assignPermissionToRole',
  async (
    { roleId, permissionId }: { roleId: number; permissionId: number },
    { rejectWithValue }
  ) => {
    try {
      await apiService.post(`/roles/${roleId}/permissions`, { permissionId });
      return { roleId, permissionId };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to assign permission to role'
      );
    }
  }
);

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchPermissions.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.permissions = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPermission.fulfilled, (state, action) => {
        state.permissions.push(action.payload);
      })
      .addCase(updatePermission.fulfilled, (state, action) => {
        const index = state.permissions.findIndex(
          permission => permission.id === action.payload.id
        );
        if (index !== -1) {
          state.permissions[index] = action.payload;
        }
      })
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.permissions = state.permissions.filter(
          permission => permission.id !== action.payload
        );
      })
      .addCase(fetchUserPermissions.fulfilled, (state, action) => {
        state.userPermissions = action.payload;
      });
  },
});

export const { clearError } = permissionsSlice.actions;
export default permissionsSlice.reducer;
