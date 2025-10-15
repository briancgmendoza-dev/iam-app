import { Request, Response, NextFunction } from 'express';
import { AccessControlService } from '../services/access-control.service';

export const opaCheckPermission = (module: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user as any).id;
      const resourceId = req.params.id ? parseInt(req.params.id) : undefined;

      const accessControlService = new AccessControlService();
      const hasPermission = await accessControlService.checkPermission(
        userId,
        module,
        action,
        resourceId
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          module,
          action,
          user: userId
        });
      }

      next();
    } catch (error) {
      console.error('OPA permission check failed:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};
