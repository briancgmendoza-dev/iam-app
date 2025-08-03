export interface User {
  id: string;
  username: string;
  groups: Group[];
  token: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  users?: User[];
  roles?: Role[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  groups?: Group[];
  permissions?: Permission[];
}

export interface Module {
  id: number;
  name: string;
  description: string;
}

export interface Permission {
  id: number;
  action: string;
  module: Module; // Changed from moduleId: number to module: Module
  description?: string;
  roles?: Role[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UserPermission {
  module: string;
  action: string;
  allowed: boolean;
}

export interface SimulateActionRequest {
  module: string;
  action: string;
}
