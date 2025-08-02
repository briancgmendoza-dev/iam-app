import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  private userService = new UserService();

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId) || !/^\d+$/.test(req.params.id)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      const user = await this.userService.getUserById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { username, password } = req.body;

      if (isNaN(userId) || !/^\d+$/.test(req.params.id)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      if (!username && !password) {
        res.status(400).json({ error: 'Username or password is required' });
        return;
      }

      const updatedUser = await this.userService.updateUser(userId, username, password);
      res.status(200).json(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          res.status(404).json({ error: error.message }); // Not Found
        } else if (error.message === 'Username already exists') {
          res.status(409).json({ error: error.message }); // Conflict
        } else {
          res.status(500).json({ error: error.message }); // Server Error
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const currentUserId = (req.user as any).id;

      if (isNaN(userId) || !/^\d+$/.test(req.params.id)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      if (userId === currentUserId) {
        res.status(400).json({ error: 'You cannot delete your own account while logged in' });
        return;
      }

      await this.userService.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          res.status(404).json({ error: error.message }); // Not Found
        } else {
          res.status(500).json({ error: error.message }); // Server Error
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }
}
