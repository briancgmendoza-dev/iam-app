import { AppDataSource } from '../db/data-source';
import { Role } from '../entities/role';
import { Group } from '../entities/group';
import { Permission } from '../entities/permission';
import { In } from 'typeorm';

export class RoleService {
  private roleRepository = AppDataSource.getRepository(Role);
  private groupRepository = AppDataSource.getRepository(Group);
  private permissionRepository = AppDataSource.getRepository(Permission);

  async createRole(name: string, description?: string): Promise<Role> {
    const existingRole = await this.roleRepository.findOneBy({ name });

    if (existingRole) {
      throw new Error('Role already exists');
    }

    const role = this.roleRepository.create({ name, description });
    return this.roleRepository.save(role);
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['groups', 'permissions', 'permissions.module'],
    });
  }

  async getRoleById(id: number): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { id },
      relations: ['groups', 'permissions', 'permissions.module'],
    });
  }

  async updateRole(id: number, name?: string, description?: string): Promise<Role> {
    const role = await this.roleRepository.findOneBy({ id });

    if (!role) {
      throw new Error('Role not found');
    }

    if (name !== undefined) {
      const existingRole = await this.roleRepository.findOneBy({ name });
      if (existingRole && existingRole.id !== id) {
        throw new Error('Role name already exists');
      }
      role.name = name;
    }

    if (description !== undefined) {
      role.description = description;
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: number): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['groups', 'permissions'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Remove role from all groups and permissions before deleting
    role.groups = [];
    role.permissions = [];
    await this.roleRepository.save(role);

    await this.roleRepository.remove(role);
  }

  async assignGroupsToRole(roleId: number, groupIds: number[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['groups'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const groups = await this.groupRepository.findBy({ id: In(groupIds) });

    if (groups.length !== groupIds.length) {
      throw new Error('One or more groups not found');
    }

    const existingGroupIds = role.groups.map(group => group.id);
    const newGroups = groups.filter(group => !existingGroupIds.includes(group.id));

    role.groups = [...role.groups, ...newGroups];
    return this.roleRepository.save(role);
  }

  async removeGroupsFromRole(roleId: number, groupIds: number[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['groups'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    role.groups = role.groups.filter(group => !groupIds.includes(group.id));
    return this.roleRepository.save(role);
  }

  async getRoleGroups(roleId: number): Promise<Group[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['groups'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.groups;
  }

  async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const permissions = await this.permissionRepository.findBy({ id: In(permissionIds) });

    if (permissions.length !== permissionIds.length) {
      throw new Error('One or more permissions not found');
    }

    const existingPermissionIds = role.permissions.map(permission => permission.id);
    const newPermissions = permissions.filter(
      permission => !existingPermissionIds.includes(permission.id)
    );

    role.permissions = [...role.permissions, ...newPermissions];

    return this.roleRepository.save(role);
  }

  async removePermissionsFromRole(roleId: number, permissionIds: number[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    role.permissions = role.permissions.filter(
      permission => !permissionIds.includes(permission.id)
    );

    return this.roleRepository.save(role);
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions', 'permissions.module'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.permissions;
  }
}
