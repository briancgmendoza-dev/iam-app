import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Module, ApiResponse } from '../types';
import { apiService } from '../services/api';

interface ModulesState {
  modules: Module[];
  loading: boolean;
  error: string | null;
}

const initialState: ModulesState = {
  modules: [],
  loading: false,
  error: null,
};

export const fetchModules = createAsyncThunk(
  'modules/fetchModules',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<ApiResponse<Module[]>>('modules');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch modules');
    }
  }
);

export const createModule = createAsyncThunk(
  'modules/createModule',
  async (moduleData: Partial<Module>, { rejectWithValue }) => {
    try {
      const response = await apiService.post<ApiResponse<Module>>('/modules', moduleData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create module');
    }
  }
);

export const updateModule = createAsyncThunk(
  'modules/updateModule',
  async ({ id, data }: { id: number; data: Partial<Module> }, { rejectWithValue }) => {
    try {
      const response = await apiService.put<ApiResponse<Module>>(`/modules/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update module');
    }
  }
);

export const deleteModule = createAsyncThunk(
  'modules/deleteModule',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiService.delete(`/modules/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete module');
    }
  }
);

const modulesSlice = createSlice({
  name: 'modules',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchModules.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading = false;
        state.modules = action.payload;
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createModule.fulfilled, (state, action) => {
        state.modules.push(action.payload);
      })
      .addCase(updateModule.fulfilled, (state, action) => {
        const index = state.modules.findIndex(module => module.id === action.payload.id);
        if (index !== -1) {
          state.modules[index] = action.payload;
        }
      })
      .addCase(deleteModule.fulfilled, (state, action) => {
        state.modules = state.modules.filter(module => module.id !== action.payload);
      });
  },
});

export const { clearError } = modulesSlice.actions;
export default modulesSlice.reducer;
