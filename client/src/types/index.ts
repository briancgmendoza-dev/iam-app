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

export interface SimulateActionResponse {
  allowed: boolean;
  requiredPermission?: string;
  user?: {
    id: number;
    username: string;
    password: string;
  };
  userPermissions?: Array<{
    id: number;
    action: string;
    module: {
      id: number;
      name: string;
    };
  }>;
  opaDetails?: {
    violations?: string[];
    denyReasons?: Array<{
      code: string;
      message: string;
      required: { module: string; action: string };
      user_permissions: any[];
    }>;
  };
}

// OPA-specific types for the policies slice
export interface OpaMetrics {
  totalEvaluations: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  averageEvaluationTime: number;
  cacheHitRate: number;
  errorRate: number;
}

export interface OpaStatus {
  initialized: boolean;
  timestamp: string;
  version: string;
  performance?: OpaMetrics;
  health?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      message?: string;
    }>;
  };
}

export interface BatchEvaluationRequest {
  requests: Array<{
    module: string;
    action: string;
    resourceId?: number;
  }>;
}

export interface BatchEvaluationResult {
  results: Array<{
    module: string;
    action: string;
    resourceId?: number;
    allowed: boolean;
    cached?: boolean;
    evaluationTime?: number;
  }>;
  summary: {
    total: number;
    allowed: number;
    denied: number;
    cached: number;
    totalTime: number;
  };
}
