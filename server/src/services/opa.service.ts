import { loadPolicy } from '@open-policy-agent/opa-wasm';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Input validation schemas
export interface OpaInput {
  user: {
    id: number;
    username: string;
    is_admin?: boolean;
    permissions: Array<{
      id: number;
      action: string;
      module: {
        id: number;
        name: string;
      };
    }>;
  };
  resource: {
    module: string;
    user_id?: number;
    resource_id?: number;
  };
  action: string;
}

export interface OpaResult {
  allow: boolean;
  violations?: string[];
  deny_reasons?: Array<{
    code: string;
    message: string;
    required: {
      module: string;
      action: string;
    };
    user_permissions: any[];
  }>;
}

interface CacheEntry {
  result: OpaResult;
  timestamp: number;
  ttl: number;
}



export class OpaService {
  private opa: any | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  // Production features - optimized settings
  private cache = new Map<string, CacheEntry>();
  private readonly cacheSize = 5000; // Reduced for better memory usage
  private readonly defaultCacheTtl = 300000; // 5 minutes



  // Rate limiting
  private readonly rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private readonly rateLimit = 100; // requests per minute
  private readonly rateLimitWindow = 60000; // 1 minute

  // Security
  private readonly maxInputSize = 1024 * 1024; // 1MB max input

  /**
   * Initialize OPA service with production-ready features
   */
  async initialize(): Promise<void> {
    // Prevent multiple initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('🔒 Initializing production OPA service...');

      // Try to load compiled WASM policy first
      const bundlePath = path.join(__dirname, '../../dist/policies/bundle.tar.gz');

      if (fs.existsSync(bundlePath)) {
        console.log('📦 Loading compiled WASM policy bundle...');

        try {
          // Extract WASM file from bundle using tar command
          const extractDir = path.join(__dirname, '../../dist/policies/extracted');

          // Create extraction directory
          if (!fs.existsSync(extractDir)) {
            fs.mkdirSync(extractDir, { recursive: true });
          }

          // Extract the bundle
          const { execSync } = require('child_process');
          execSync(`tar -xzf "${bundlePath}" -C "${extractDir}"`, { stdio: 'pipe' });

          // Read the extracted WASM file
          const wasmPath = path.join(extractDir, 'policy.wasm');
          if (!fs.existsSync(wasmPath)) {
            throw new Error('policy.wasm not found in extracted bundle');
          }

          const policyWasm = fs.readFileSync(wasmPath);
          this.opa = await loadPolicy(policyWasm);
          console.log('✅ WASM policy loaded successfully');

        } catch (wasmError) {
          console.warn('⚠️ Failed to load WASM bundle:', wasmError);
          console.log('🔄 Using fallback implementation');
          this.opa = this.createProductionFallback();
        }
      } else {
        console.warn('⚠️ WASM bundle not found, using fallback implementation');
        console.log('💡 Run "npm run compile-policies" to generate WASM bundle');
        this.opa = this.createProductionFallback();
      }

      // Initialize cache cleanup interval
      this.startCacheCleanup();

      // Initialize periodic tasks
      this.startPeriodicTasks();



      this.initialized = true;
      console.log('🔒 OPA Service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize OPA Service:', error);
      this.initialized = false;
      throw new Error(`OPA Service initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Evaluate policy with production features: caching, rate limiting, monitoring
   */
  async evaluate(input: OpaInput): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Validate service state
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.opa) {
        throw new Error('OPA Service not available');
      }

      // Validate and sanitize input
      this.validateInput(input);

      // Rate limiting
      this.checkRateLimit(input.user.id.toString());

      // Check cache first
      const cacheKey = this.generateCacheKey(input);
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return cached.allow;
      }

      // Evaluate with real OPA
      const result = await this.evaluateWithOpa(input);

      // Cache the result
      this.setCache(cacheKey, result);

      // Audit logging for denied access
      if (!result.allow) {
        this.auditLog('ACCESS_DENIED', input, result);
      }

      return result.allow;

    } catch (error) {
      console.error('❌ OPA evaluation error:', error);
      this.auditLog('EVALUATION_ERROR', input, null, error);

      // Fail securely - deny access on evaluation errors
      return false;
    }
  }

  /**
   * Evaluate policy with detailed results for debugging and audit
   */
  async evaluateWithDetails(input: OpaInput): Promise<{
    allowed: boolean;
    violations?: string[];
    denyReasons?: Array<{
      code: string;
      message: string;
      required: { module: string; action: string };
      user_permissions: any[];
    }>;
  }> {
    try {
      const result = await this.evaluateWithOpa(input);

      return {
        allowed: result.allow,
        violations: result.violations,
        denyReasons: result.deny_reasons,
      };
    } catch (error) {
      console.error('❌ OPA evaluation error:', error);
      return {
        allowed: false,
        violations: [`Evaluation error: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }



  /**
   * Clear cache - useful for policy updates
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ OPA cache cleared');
  }

  /**
   * Validate input for security and correctness
   */
  private validateInput(input: OpaInput): void {
    const inputStr = JSON.stringify(input);

    if (inputStr.length > this.maxInputSize) {
      throw new Error('Input too large');
    }

    if (!input.user || !input.resource || !input.action) {
      throw new Error('Invalid input: missing required fields');
    }

    if (typeof input.user.id !== 'number' || input.user.id <= 0) {
      throw new Error('Invalid user ID');
    }

    if (!input.user.username || typeof input.user.username !== 'string') {
      throw new Error('Invalid username');
    }

    if (!input.resource.module || typeof input.resource.module !== 'string') {
      throw new Error('Invalid resource module');
    }

    if (!input.action || typeof input.action !== 'string') {
      throw new Error('Invalid action');
    }
  }

  /**
   * Rate limiting per user
   */
  private checkRateLimit(userId: string): void {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimitMap.set(userId, {
        count: 1,
        resetTime: now + this.rateLimitWindow
      });
      return;
    }

    if (userLimit.count >= this.rateLimit) {
      throw new Error('Rate limit exceeded');
    }

    userLimit.count++;
  }

  /**
   * Generate cache key for input
   */
  private generateCacheKey(input: OpaInput): string {
    const key = {
      userId: input.user.id,
      isAdmin: input.user.is_admin || false,
      permissions: input.user.permissions.map(p => `${p.module.name}:${p.action}`).sort(),
      resource: input.resource.module,
      resourceId: input.resource.resource_id || null,
      resourceUserId: input.resource.user_id || null,
      action: input.action
    };

    return crypto.createHash('sha256').update(JSON.stringify(key)).digest('hex');
  }

  /**
   * Get result from cache
   */
  private getFromCache(key: string): OpaResult | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  /**
   * Set result in cache with optimized LRU eviction
   */
  private setCache(key: string, result: OpaResult, ttl = this.defaultCacheTtl): void {
    // Remove oldest entries if cache is full (LRU behavior)
    if (this.cache.size >= this.cacheSize) {
      // Remove the first (oldest) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Actual OPA evaluation with both WASM and fallback
   */
  private async evaluateWithOpa(input: OpaInput): Promise<OpaResult> {
    try {
      console.log('🔍 OPA EVALUATION - Checking WASM availability:', {
        hasOpa: !!this.opa,
        hasEvaluate: this.opa && typeof this.opa.evaluate === 'function'
      });

      // If we have real OPA WASM loaded
      if (this.opa && typeof this.opa.evaluate === 'function') {
        console.log('📦 Using WASM OPA evaluation');
        const result = this.opa.evaluate(input);

        console.log('📊 WASM OPA Result:', result);

        // Handle different result formats from OPA WASM
        if (result && typeof result === 'object') {
          // Handle array format: [{ result: true }]
          if (Array.isArray(result) && result.length > 0) {
            const firstResult = result[0];
            return {
              allow: firstResult.result || firstResult.allow || false,
              violations: firstResult.violations,
              deny_reasons: firstResult.deny_reasons
            };
          }

          // Handle object format: { result: { allow: true } } or { allow: true }
          return {
            allow: result.allow || result.result?.allow || result.result || false,
            violations: result.violations || result.result?.violations,
            deny_reasons: result.deny_reasons || result.result?.deny_reasons
          };
        }
      }

      // Fallback to built-in policy
      console.log('🔄 Using fallback policy evaluation');
      return this.evaluateRbacPolicy(input);

    } catch (error) {
      console.error('OPA evaluation failed:', error);
      throw error;
    }
  }

  /**
   * Production-ready fallback policy implementation
   */
  private evaluateRbacPolicy(input: OpaInput): OpaResult {
    const { user, resource, action } = input;

    console.log('🔍 FALLBACK POLICY EVALUATION:', {
      username: user.username,
      is_admin: user.is_admin,
      resource: resource.module,
      action: action,
      permissions: user.permissions.length
    });

    // Default deny
    let allow = false;
    const violations: string[] = [];
    const deny_reasons: any[] = [];

    // Admin override - but with audit
    if (user.is_admin || user.username === 'admin') {
      allow = true;
      console.log(`🔑 Admin access granted: ${user.username} -> ${resource.module}:${action}`);
    }

    // Check specific permissions for non-admin users
    else {
      const hasPermission = user.permissions.some(
        permission =>
          permission.module.name.toLowerCase() === resource.module.toLowerCase() &&
          permission.action.toLowerCase() === action.toLowerCase()
      );

      if (hasPermission) {
        allow = true;
        console.log(`✅ Permission granted: ${user.username} -> ${resource.module}:${action}`);
      }
    }

    // Self-access rules (users can read/update their own data)
    if (!allow && resource.module === 'users' && resource.user_id === user.id) {
      if (action === 'read' || action === 'update') {
        allow = true;
        console.log(`👤 Self-access granted: ${user.username} -> own profile:${action}`);
      }
    }

    // Generate audit information for denied access
    if (!allow) {
      violations.push(
        `User ${user.id} (${user.username}) denied access to ${resource.module}:${action}`
      );

      deny_reasons.push({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'User does not have required permissions',
        required: {
          module: resource.module,
          action: action,
        },
        user_permissions: user.permissions,
      });
    }

    return {
      allow,
      violations: violations.length > 0 ? violations : undefined,
      deny_reasons: deny_reasons.length > 0 ? deny_reasons : undefined,
    };
  }

  /**
   * Production fallback when WASM can't be loaded
   */
  private createProductionFallback() {
    return {
      evaluate: (input: OpaInput) => this.evaluateRbacPolicy(input)
    };
  }



  /**
   * Audit logging for security events
   */
  private auditLog(
    event: string,
    input: OpaInput,
    result: OpaResult | null,
    error?: any
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId: input.user.id,
      username: input.user.username,
      resource: input.resource.module,
      action: input.action,
      allowed: result?.allow || false,
      violations: result?.violations,
      error: error instanceof Error ? error.message : error,
      userAgent: process.env.NODE_ENV === 'production' ? 'server' : 'development'
    };

    // In production, send to proper logging service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to centralized logging (ELK, Splunk, etc.)
      console.log('🔍 AUDIT:', JSON.stringify(logEntry));
    } else {
      console.log('🔍 AUDIT:', logEntry);
    }
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.timestamp + entry.ttl) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
      }
    }, 60000); // Clean every minute
  }

  /**
   * Start periodic cleanup tasks
   */
  private startPeriodicTasks(): void {
    // Reset rate limits periodically
    setInterval(() => {
      this.rateLimitMap.clear();
    }, this.rateLimitWindow);
  }
}

// Singleton instance
export const opaService = new OpaService();
