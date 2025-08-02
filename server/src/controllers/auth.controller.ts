import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService = new AuthService();

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      const cleanedUsername = username?.replace(/\s+/g, '').toLowerCase();
      const cleanedPassword = password?.replace(/\s+/g, '').toLowerCase();

      if (!cleanedUsername || cleanedUsername.length === 0) {
        res.status(400).json({ error: 'Username is required' });
        return;
      }

      if (!cleanedPassword || cleanedPassword.length === 0) {
        res.status(400).json({ error: 'Password is required' });
        return;
      }

      await this.authService.register(cleanedUsername, cleanedPassword);
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User already exists') {
          res.status(409).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      const cleanedUsername = username?.replace(/\s+/g, '').toLowerCase();
      const cleanedPassword = password?.replace(/\s+/g, '').toLowerCase();

      if (!cleanedUsername || cleanedUsername.length === 0) {
        res.status(400).json({ error: 'Username is required' });
        return;
      }

      if (!cleanedPassword || cleanedPassword.length === 0) {
        res.status(400).json({ error: 'Password is required' });
        return;
      }

      const token = await this.authService.login(cleanedUsername, cleanedPassword);
      res.status(200).json({ token });
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(401).json({ error: String(error) });
      }
    }
  }
}
