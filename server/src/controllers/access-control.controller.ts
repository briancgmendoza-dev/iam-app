import { Request, Response } from 'express';
import { AccessControlService } from '../services/access-control.service';
import { isNotNumeric, hasLeadingOrTrailingWhitespace } from '../utils';

export class AccessControlController {
  private accessControlService = new AccessControlService();

  async getMyPermissions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any).id;

      if (!userId || isNotNumeric(userId)) {
        res
          .status(401)
          .json({ error: isNotNumeric(userId) ? 'Invalid User ID' : 'User not authenticated' });
        return;
      }

      const permissions = await this.accessControlService.getUserPermissions(userId);

      res.status(200).json(permissions);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async simulateAction(req: Request, res: Response): Promise<void> {
    try {
      const { userId, module, action } = req.body;

      if (isNotNumeric(userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      if (hasLeadingOrTrailingWhitespace(module) || hasLeadingOrTrailingWhitespace(action)) {
        res
          .status(400)
          .json({ error: 'Module and action cannot have leading or trailing whitespace' });
        return;
      }

      if (!userId || !module || !action) {
        res.status(400).json({ error: 'userId, module, and action are required' });
        return;
      }

      const result = await this.accessControlService.simulateAction(userId, module, action);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }
}
