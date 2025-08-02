import { AppDataSource } from '../db/data-source';
import { Group } from '../entities/group';
import { Role } from '../entities/role';
import { User } from '../entities/user';
import { In } from 'typeorm';

export class GroupService {
  private groupRepository = AppDataSource.getRepository(Group);
  private roleRepository = AppDataSource.getRepository(Role);
  private userRepository = AppDataSource.getRepository(User);

  async createGroup(name: string, description?: string): Promise<Group> {
    if (!name || name.trim().length === 0) {
      throw new Error('Group name is required');
    }

    const existingGroup = await this.groupRepository.findOneBy({ name: name.trim() });

    if (existingGroup) {
      throw new Error('Group already exists');
    }

    const group = this.groupRepository.create({
      name: name.trim(),
      description: description?.trim(),
    });
    return this.groupRepository.save(group);
  }

  async getAllGroups(): Promise<Group[]> {
    return this.groupRepository.find({
      relations: ['users', 'roles'],
    });
  }

  async getGroupById(id: number): Promise<Group | null> {
    if (!id || id <= 0) {
      throw new Error('Invalid group ID');
    }

    return this.groupRepository.findOne({
      where: { id },
      relations: ['users', 'roles'],
    });
  }

  async updateGroup(id: number, name?: string, description?: string): Promise<Group> {
    if (!id || id <= 0) {
      throw new Error('Invalid group ID');
    }

    const group = await this.groupRepository.findOneBy({ id });

    if (!group) {
      throw new Error('Group not found');
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (trimmedName.length === 0) {
        throw new Error('Group name cannot be empty');
      }

      const existingGroup = await this.groupRepository.findOneBy({ name: trimmedName });
      if (existingGroup && existingGroup.id !== id) {
        throw new Error('Group name already exists');
      }
      group.name = trimmedName;
    }

    if (description !== undefined) {
      group.description = description?.trim();
    }

    return this.groupRepository.save(group);
  }

  async deleteGroup(id: number): Promise<void> {
    if (!id || id <= 0) {
      throw new Error('Invalid group ID');
    }

    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['users', 'roles'],
    });

    if (!group) {
      throw new Error('Group not found');
    }

    // Remove relationships before deleting
    group.users = [];
    group.roles = [];
    await this.groupRepository.save(group);

    await this.groupRepository.remove(group);
  }

  async assignUsersToGroup(groupId: number, userIds: number[]): Promise<Group> {
    if (!groupId || groupId <= 0) {
      throw new Error('Invalid group ID');
    }

    if (!userIds || userIds.length === 0) {
      throw new Error('User IDs are required');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['users'],
    });

    if (!group) {
      throw new Error('Group not found');
    }

    const users = await this.userRepository.findBy({ id: In(userIds) });

    if (users.length !== userIds.length) {
      throw new Error('One or more users not found');
    }

    const existingUserIds = group.users.map(user => user.id);
    const newUsers = users.filter(user => !existingUserIds.includes(user.id));

    group.users = [...group.users, ...newUsers];
    return this.groupRepository.save(group);
  }

  async removeUsersFromGroup(groupId: number, userIds: number[]): Promise<Group> {
    if (!groupId || groupId <= 0) {
      throw new Error('Invalid group ID');
    }

    if (!userIds || userIds.length === 0) {
      throw new Error('User IDs are required');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['users'],
    });

    if (!group) {
      throw new Error('Group not found');
    }

    group.users = group.users.filter(user => !userIds.includes(user.id));
    return this.groupRepository.save(group);
  }

  async getUsersByGroupId(groupId: number): Promise<User[]> {
    if (!groupId || groupId <= 0) {
      throw new Error('Invalid group ID');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['users'],
    });

    if (!group) {
      throw new Error('Group not found');
    }

    return group.users;
  }

  async assignRolesToGroup(groupId: number, roleIds: number[]): Promise<Group> {
    if (!groupId || groupId <= 0) {
      throw new Error('Invalid group ID');
    }

    if (!roleIds || roleIds.length === 0) {
      throw new Error('Role IDs are required');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['roles'],
    });

    if (!group) {
      throw new Error('Group not found');
    }

    const roles = await this.roleRepository.findBy({ id: In(roleIds) });

    if (roles.length !== roleIds.length) {
      throw new Error('One or more roles not found');
    }

    const existingRoleIds = group.roles.map(role => role.id);
    const newRoles = roles.filter(role => !existingRoleIds.includes(role.id));

    group.roles = [...group.roles, ...newRoles];
    return this.groupRepository.save(group);
  }

  async removeRolesFromGroup(groupId: number, roleIds: number[]): Promise<Group> {
    if (!groupId || groupId <= 0) {
      throw new Error('Invalid group ID');
    }

    if (!roleIds || roleIds.length === 0) {
      throw new Error('Role IDs are required');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['roles'],
    });

    if (!group) {
      throw new Error('Group not found');
    }

    group.roles = group.roles.filter(role => !roleIds.includes(role.id));
    return this.groupRepository.save(group);
  }

  async getGroupRoles(groupId: number): Promise<Role[]> {
    if (!groupId || groupId <= 0) {
      throw new Error('Invalid group ID');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['roles'],
    });

    if (!group) {
      throw new Error('Group not found');
    }

    return group.roles;
  }
}
