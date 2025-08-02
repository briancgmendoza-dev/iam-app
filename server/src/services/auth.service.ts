import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../db/data-source';
import { User } from '../entities/user';

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(username: string, password: string): Promise<void> {
    if (!username || username.trim().length === 0) {
      throw new Error('Username is required');
    }

    if (!password || password.trim().length === 0) {
      throw new Error('Password is required');
    }

    const existingUser = await this.userRepository.findOneBy({ username: username.trim() });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const user = this.userRepository.create({
      username: username.trim(),
      password: hashedPassword,
    });
    await this.userRepository.save(user);
  }

  async login(username: string, password: string): Promise<string> {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    const user = await this.userRepository.findOneBy({ username: username.trim() });

    if (!user || !(await bcrypt.compare(password.trim(), user.password))) {
      throw new Error('Invalid username or password');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  }
}
