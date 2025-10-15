import { AppDataSource } from '../db/data-source';
import { User } from '../entities/user';
import { Permission } from '../entities/permission';
import { opaService, OpaInput } from './opa.service';

export class AccessControlService {
  private userRepository = AppDataSource.getRepository(User);
  private permissionCache = new Map<number, { permissions: Permission[]; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getUserPermissions(userId: number): Promise<Permission[]> {
    // Check cache first
    const cached = this.permissionCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.permissions;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'groups',
        'groups.roles',
        'groups.roles.permissions',
        'groups.roles.permissions.module',
      ],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Use Set for efficient duplicate removal
    const permissionMap = new Map<number, Permission>();
    user.groups?.forEach(group => {
      group.roles?.forEach(role => {
        role.permissions?.forEach(permission => {
          permissionMap.set(permission.id, permission);
        });
      });
    });

    const permissions = Array.from(permissionMap.values());

    // Cache the results
    this.permissionCache.set(userId, {
      permissions,
      timestamp: Date.now(),
    });

    return permissions;
  }

  /**
   * Clear permission cache for a user (call when user permissions change)
   */
  clearUserPermissionCache(userId?: number): void {
    if (userId) {
      this.permissionCache.delete(userId);
    } else {
      this.permissionCache.clear();
    }
  }

  async checkPermission(userId: number, module: string, action: string, resourceId?: number): Promise<boolean> {
    // Get user and permissions
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const permissions = await this.getUserPermissions(userId);

    // Prepare OPA input
    const opaInput: OpaInput = {
      user: {
        id: user.id,
        username: user.username,
        is_admin: user.username === 'admin', // You can add an is_admin field to User entity
        permissions: permissions.map(p => ({
          id: p.id,
          action: p.action,
          module: {
            id: p.module.id,
            name: p.module.name,
          },
        })),
      },
      resource: {
        module: module.toLowerCase(),
        user_id: resourceId, // For user-specific resources
        resource_id: resourceId,
      },
      action: action.toLowerCase(),
    };

    // Use OPA for policy evaluation
    if (opaService.isInitialized()) {
      return await opaService.evaluate(opaInput);
    } else {
      // Fallback to original logic if OPA is not available
      console.warn('⚠️ OPA not initialized, falling back to original permission check');
      return permissions.some(
        permission =>
          permission.module.name.toLowerCase() === module.toLowerCase() &&
          permission.action.toLowerCase() === action.toLowerCase()
      );
    }
  }

  async simulateAction(
    userId: number,
    module: string,
    action: string,
    resourceId?: number
  ): Promise<{
    allowed: boolean;
    user: User | null;
    requiredPermission: string;
    userPermissions: Permission[];
    opaDetails?: {
      violations?: string[];
      denyReasons?: Array<{
        code: string;
        message: string;
        required: { module: string; action: string };
        user_permissions: any[];
      }>;
    };
  }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const userPermissions = await this.getUserPermissions(userId);

    // Prepare OPA input for detailed evaluation
    const opaInput: OpaInput = {
      user: {
        id: user.id,
        username: user.username,
        is_admin: user.username === 'admin',
        permissions: userPermissions.map(p => ({
          id: p.id,
          action: p.action,
          module: {
            id: p.module.id,
            name: p.module.name,
          },
        })),
      },
      resource: {
        module: module.toLowerCase(),
        user_id: resourceId,
        resource_id: resourceId,
      },
      action: action.toLowerCase(),
    };

    // Debug logging
    console.log('🔍 OPA Input Debug:', {
      user: {
        id: opaInput.user.id,
        username: opaInput.user.username,
        is_admin: opaInput.user.is_admin,
        permissions_count: opaInput.user.permissions.length
      },
      resource: opaInput.resource.module,
      action: opaInput.action
    });

    let allowed = false;
    let opaDetails = undefined;

    // Use OPA for detailed policy evaluation
    if (opaService.isInitialized()) {
      const evaluation = await opaService.evaluateWithDetails(opaInput);
      allowed = evaluation.allowed;
      opaDetails = {
        violations: evaluation.violations,
        denyReasons: evaluation.denyReasons,
      };
    } else {
      // Fallback to original logic
      console.warn('⚠️ OPA not initialized, falling back to original permission check');
      allowed = await this.checkPermission(userId, module, action, resourceId);
    }

    return {
      allowed,
      user,
      requiredPermission: `${action} on ${module}`,
      userPermissions,
      opaDetails,
    };
  }
}
