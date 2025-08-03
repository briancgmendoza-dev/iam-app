import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../db/data-source';
import { User } from '../entities/user';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(username: string, password: string): Promise<void> {
    const existingUser = await this.userRepository.findOneBy({ username });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
    });

    await this.userRepository.save(user);
  }

  async login(username: string, password: string): Promise<{ id: number; username: string; token: string; groups: string[] }> {
    const user = await this.userRepository.findOne({
      where: { username },
      relations: ['groups'],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid username or password');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const groups = user.groups ? user.groups.map((g: any) => g.name) : [];

    return { id: user.id, username: user.username, token, groups };
  }
}
