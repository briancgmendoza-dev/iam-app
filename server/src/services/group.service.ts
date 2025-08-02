import { AppDataSource } from '../db/data-source';
import { Group } from '../entities/group';
import { User } from '../entities/user';
import { In } from 'typeorm';

export class GroupService {
  private groupRepository = AppDataSource.getRepository(Group);
  private userRepository = AppDataSource.getRepository(User);

  async createGroup(name: string, description?: string): Promise<Group> {
    const existingGroup = await this.groupRepository.findOneBy({ name });

    if (existingGroup) {
      throw new Error('Group already exists');
    }

    const group = this.groupRepository.create({ name, description });

    return this.groupRepository.save(group);
  }

  async getAllGroups(): Promise<Group[]> {
    return this.groupRepository.find({
      relations: ['users', 'roles'],
    });
  }

  async getGroupById(id: number): Promise<Group | null> {
    return this.groupRepository.findOne({
      where: { id },
      relations: ['users', 'roles'],
    });
  }

  async updateGroup(id: number, name?: string, description?: string): Promise<Group> {
    const group = await this.groupRepository.findOneBy({ id });

    if (!group) {
      throw new Error('Group not found');
    }

    if (name !== undefined) {
      const existingGroup = await this.groupRepository.findOneBy({ name });
      if (existingGroup && existingGroup.id !== id) {
        throw new Error('Group name already exists');
      }
      group.name = name;
    }

    if (description !== undefined) {
      group.description = description;
    }

    return this.groupRepository.save(group);
  }

  async deleteGroup(id: number): Promise<void> {
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
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['users'],
    });

    if (!group) {
      throw new Error('Group not found');
    }

    return group.users;
  }
}
