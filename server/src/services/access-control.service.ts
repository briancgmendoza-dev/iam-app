import { AppDataSource } from '../db/data-source';
import { User } from '../entities/user';
import { Permission } from '../entities/permission';

export class AccessControlService {
  private userRepository = AppDataSource.getRepository(User);

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

  async checkPermission(userId: number, module: string, action: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    return permissions.some(
      permission =>
        permission.module.name.toLowerCase() === module.toLowerCase() &&
        permission.action.toLowerCase() === action.toLowerCase()
    );
  }

  async simulateAction(
    userId: number,
    module: string,
    action: string
  ): Promise<{
    allowed: boolean;
    user: User | null;
    requiredPermission: string;
    userPermissions: Permission[];
  }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    const userPermissions = await this.getUserPermissions(userId);
    const allowed = await this.checkPermission(userId, module, action);

    return {
      allowed,
      user,
      requiredPermission: `${action} on ${module}`,
      userPermissions,
    };
  }
}
