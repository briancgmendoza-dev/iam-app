import { AppDataSource } from '../db/data-source';
import { Permission } from '../entities/permission';
import { Module } from '../entities/module';
import { Role } from '../entities/role';
import { In } from 'typeorm';

export class PermissionService {
  private permissionRepository = AppDataSource.getRepository(Permission);
  private moduleRepository = AppDataSource.getRepository(Module);
  private roleRepository = AppDataSource.getRepository(Role);

  async createPermission(action: string, moduleId: number): Promise<Permission> {
    const validActions = ['create', 'read', 'update', 'delete'];
    if (!validActions.includes(action.toLowerCase())) {
      throw new Error('Invalid action. Must be one of: create, read, update, delete');
    }

    const module = await this.moduleRepository.findOneBy({ id: moduleId });
    if (!module) {
      throw new Error('Module not found');
    }

    // Check if permission already exists for this module and action
    const existingPermission = await this.permissionRepository.findOne({
      where: { action: action.toLowerCase(), module: { id: moduleId } },
      relations: ['module'],
    });

    if (existingPermission) {
      throw new Error('Permission already exists for this module and action');
    }

    const permission = this.permissionRepository.create({
      action: action.toLowerCase(),
      module: module,
    });

    return this.permissionRepository.save(permission);
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      relations: ['module', 'roles'],
    });
  }

  async getPermissionById(id: number): Promise<Permission | null> {
    return this.permissionRepository.findOne({
      where: { id },
      relations: ['module', 'roles'],
    });
  }

  async updatePermission(id: number, action?: string, moduleId?: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['module'],
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    if (action !== undefined) {
      const validActions = ['create', 'read', 'update', 'delete'];
      if (!validActions.includes(action.toLowerCase())) {
        throw new Error('Invalid action. Must be one of: create, read, update, delete');
      }

      // Check if this action already exists for the same module
      const existingPermission = await this.permissionRepository.findOne({
        where: {
          action: action.toLowerCase(),
          module: { id: moduleId || permission.module.id },
        },
        relations: ['module'],
      });

      if (existingPermission && existingPermission.id !== id) {
        throw new Error('Permission already exists for this module and action');
      }

      permission.action = action.toLowerCase();
    }

    if (moduleId !== undefined) {
      const module = await this.moduleRepository.findOneBy({ id: moduleId });
      if (!module) {
        throw new Error('Module not found');
      }

      permission.module = module;
    }

    return this.permissionRepository.save(permission);
  }

  async deletePermission(id: number): Promise<void> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['roles'],
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    // Remove permission from all roles before deleting
    if (permission.roles && permission.roles.length > 0) {
      permission.roles = [];
      await this.permissionRepository.save(permission);
    }

    await this.permissionRepository.remove(permission);
  }

  async assignPermissionToRoles(permissionId: number, roleIds: number[]): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
      relations: ['roles'],
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    const roles = await this.roleRepository.findBy({ id: In(roleIds) });

    if (roles.length !== roleIds.length) {
      throw new Error('One or more roles not found');
    }

    const existingRoleIds = permission.roles.map(role => role.id);
    const newRoles = roles.filter(role => !existingRoleIds.includes(role.id));

    permission.roles = [...permission.roles, ...newRoles];
    return this.permissionRepository.save(permission);
  }

  async removeRolesFromPermission(permissionId: number, roleIds: number[]): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
      relations: ['roles'],
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    permission.roles = permission.roles.filter(role => !roleIds.includes(role.id));
    return this.permissionRepository.save(permission);
  }

  async getPermissionsByModule(moduleId: number): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { module: { id: moduleId } },
      relations: ['module', 'roles'],
    });
  }
}
