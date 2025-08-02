import { AppDataSource } from '../db/data-source';
import { Role } from '../entities/role';
import { Group } from '../entities/group';
import { In } from 'typeorm';

export class RoleService {
  private roleRepository = AppDataSource.getRepository(Role);
  private groupRepository = AppDataSource.getRepository(Group);

  async createRole(name: string, description?: string): Promise<Role> {
    if (!name || name.trim().length === 0) {
      throw new Error('Role name is required');
    }

    const existingRole = await this.roleRepository.findOneBy({ name: name.trim() });

    if (existingRole) {
      throw new Error('Role already exists');
    }

    const role = this.roleRepository.create({
      name: name.trim(),
      description: description?.trim(),
    });
    return this.roleRepository.save(role);
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['groups'],
    });
  }

  async getRoleById(id: number): Promise<Role | null> {
    if (!id || id <= 0) {
      throw new Error('Invalid role ID');
    }

    return this.roleRepository.findOne({
      where: { id },
      relations: ['groups'],
    });
  }

  async updateRole(id: number, name?: string, description?: string): Promise<Role> {
    if (!id || id <= 0) {
      throw new Error('Invalid role ID');
    }

    const role = await this.roleRepository.findOneBy({ id });

    if (!role) {
      throw new Error('Role not found');
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (trimmedName.length === 0) {
        throw new Error('Role name cannot be empty');
      }

      const existingRole = await this.roleRepository.findOneBy({ name: trimmedName });
      if (existingRole && existingRole.id !== id) {
        throw new Error('Role name already exists');
      }
      role.name = trimmedName;
    }

    if (description !== undefined) {
      role.description = description?.trim();
    }

    return this.roleRepository.save(role);
  }

  async deleteRole(id: number): Promise<void> {
    if (!id || id <= 0) {
      throw new Error('Invalid role ID');
    }

    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['groups'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Remove role from all groups before deleting
    if (role.groups && role.groups.length > 0) {
      role.groups = [];
      await this.roleRepository.save(role);
    }

    await this.roleRepository.remove(role);
  }

  async assignGroupsToRole(roleId: number, groupIds: number[]): Promise<Role> {
    if (!roleId || roleId <= 0) {
      throw new Error('Invalid role ID');
    }

    if (!groupIds || groupIds.length === 0) {
      throw new Error('Group IDs are required');
    }

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
    if (!roleId || roleId <= 0) {
      throw new Error('Invalid role ID');
    }

    if (!groupIds || groupIds.length === 0) {
      throw new Error('Group IDs are required');
    }

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
    if (!roleId || roleId <= 0) {
      throw new Error('Invalid role ID');
    }

    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['groups'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.groups;
  }
}
