import { AppDataSource } from '../db/data-source';
import { User } from '../entities/user';
import { Permission } from '../entities/permission';
import { OPAService, OPAInput } from './opa.service';

export class AccessControlService {
  private userRepository = AppDataSource.getRepository(User);
  private opaService = new OPAService();

  constructor() {
    this.initializeOPA();
  }

  private async initializeOPA(): Promise<void> {
    try {
      await this.opaService.initialize();
    } catch (error) {
      console.error('Failed to initialize OPA service:', error);
    }
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
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

    // Flatten permissions from all groups and roles
    const permissions: Permission[] = [];
    user.groups?.forEach(group => {
      group.roles?.forEach(role => {
        role.permissions?.forEach(permission => {
          // Avoid duplicates
          if (!permissions.find(p => p.id === permission.id)) {
            permissions.push(permission);
          }
        });
      });
    });

    return permissions;
  }

  async checkPermission(userId: number, module: string, action: string, resourceId?: number): Promise<boolean> {
    try {
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

      // Prepare OPA input
      const opaInput: OPAInput = {
        user: {
          id: user.id,
          username: user.username,
          groups: user.groups?.map(group => ({
            id: group.id,
            name: group.name,
            roles: group.roles?.map(role => ({
              id: role.id,
              name: role.name,
              permissions: role.permissions?.map(permission => ({
                id: permission.id,
                action: permission.action,
                module: {
                  id: permission.module.id,
                  name: permission.module.name,
                },
              })) || [],
            })) || [],
          })) || [],
        },
        action: action.toLowerCase(),
        resource: {
          module: module,
          id: resourceId,
          owner_id: resourceId === userId ? userId : undefined, // For self-access scenarios
        },
      };

      const result = await this.opaService.evaluateWithAudit(opaInput);
      return result.allowed;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
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
    auditLog?: any;
  }> {
    try {
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

      const userPermissions = await this.getUserPermissions(userId);

      // Use OPA for decision
      const opaInput: OPAInput = {
        user: {
          id: user.id,
          username: user.username,
          groups: user.groups?.map(group => ({
            id: group.id,
            name: group.name,
            roles: group.roles?.map(role => ({
              id: role.id,
              name: role.name,
              permissions: role.permissions?.map(permission => ({
                id: permission.id,
                action: permission.action,
                module: {
                  id: permission.module.id,
                  name: permission.module.name,
                },
              })) || [],
            })) || [],
          })) || [],
        },
        action: action.toLowerCase(),
        resource: {
          module: module,
          id: resourceId,
        },
      };

      const result = await this.opaService.evaluateWithAudit(opaInput);

      return {
        allowed: result.allowed,
        user,
        requiredPermission: `${action}:${module}`,
        userPermissions,
        auditLog: result.auditLog,
      };
    } catch (error) {
      console.error('Action simulation failed:', error);
      throw error;
    }
  }
}
