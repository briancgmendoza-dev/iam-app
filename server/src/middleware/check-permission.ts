import { Request, Response, NextFunction } from 'express';
import { AccessControlService } from '../services/access-control.service';

export const checkPermission = (module: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user as any).id;
      const accessControlService = new AccessControlService();

      const hasPermission = await accessControlService.checkPermission(userId, module, action);

      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};
