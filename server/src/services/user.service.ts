import { AppDataSource } from '../db/data-source';
import { User } from '../entities/user';
import bcrypt from 'bcryptjs';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({ relations: ['groups'] });
  }

  async getUserById(id: number): Promise<User | null> {
    if (!id || isNaN(id) || id <= 0) {
      throw new Error('Invalid user ID');
    }

    return this.userRepository.findOne({
      where: { id },
      relations: ['groups'],
    });
  }

  async updateUser(id: number, username?: string, password?: string): Promise<User> {
    if (!id || isNaN(id) || id <= 0) {
      throw new Error('Invalid user ID');
    }

    if (username === undefined && password === undefined) {
      throw new Error('Username or password is required');
    }

    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new Error('User not found');
    }

    if (username !== undefined) {
      const trimmedUsername = username.trim();

      if (trimmedUsername.length === 0) {
        throw new Error('Username cannot be empty');
      }

      const existingUser = await this.userRepository.findOneBy({ username: trimmedUsername });

      if (existingUser && existingUser.id !== id) {
        throw new Error('Username already exists');
      }

      user.username = trimmedUsername;
    }

    if (password !== undefined) {
      if (password.trim().length === 0) {
        throw new Error('Password cannot be empty');
      }

      user.password = await bcrypt.hash(password, 10);
    }

    return this.userRepository.save(user);
  }

  async deleteUser(id: number): Promise<void> {
    if (!id || isNaN(id) || id <= 0) {
      throw new Error('Invalid user ID');
    }

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['groups'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.groups && user.groups.length > 0) {
      user.groups = [];
      await this.userRepository.save(user);
    }

    await this.userRepository.remove(user);
  }

  // async getUserPermissions(id: number): Promise<any[]> {
  //   if (!id || id <= 0) {
  //     throw new Error('Invalid user ID');
  //   }

  //   const user = await this.userRepository.findOne({
  //     where: { id },
  //     relations: ["groups", "groups.roles", "groups.roles.permissions"]
  //   });

  //   if (!user) {
  //     throw new Error('User not found');
  //   }

  //   // Flatten permissions from all groups and roles
  //   const permissions: any[] = [];
  //   user.groups?.forEach(group => {
  //     group.roles?.forEach(role => {
  //       role.permissions?.forEach(permission => {
  //         // Avoid duplicates
  //         if (!permissions.find(p => p.id === permission.id)) {
  //           permissions.push(permission);
  //         }
  //       });
  //     });
  //   });

  //   return permissions;
  // }
}
