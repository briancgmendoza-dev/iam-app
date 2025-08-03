import { AppDataSource } from '../db/data-source';
import { User } from '../entities/user';
import bcrypt from 'bcryptjs';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find({ relations: ['groups'] });
  }

  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['groups'],
    });
  }

  async updateUser(id: number, username?: string, password?: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new Error('User not found');
    }

    if (username !== undefined) {
      const existingUser = await this.userRepository.findOneBy({ username });
      if (existingUser && existingUser.id !== id) {
        throw new Error('Username already exists');
      }
      user.username = username;
    }

    if (password !== undefined) {
      user.password = await bcrypt.hash(password, 10);
    }

    return this.userRepository.save(user);
  }

  async deleteUser(id: number): Promise<void> {
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
}
