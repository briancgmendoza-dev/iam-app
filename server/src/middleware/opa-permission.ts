import { Request, Response, NextFunction } from 'express';
import { AccessControlService } from '../services/access-control.service';

export const checkPermission = (module: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user as any).id;
      const accessControlService = new AccessControlService();

      // Extract resource ID from request parameters if available
      const resourceId = req.params.id ? parseInt(req.params.id) : undefined;

      const hasPermission = await accessControlService.checkPermission(
        userId,
        module,
        action,
        resourceId
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: {
            module,
            action,
            resource: resourceId
          }
        });
      }

      next();
    } catch (error) {
      console.error('❌ Permission check failed:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Enhanced middleware that provides detailed OPA evaluation results
export const checkPermissionWithDetails = (module: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req.user as any).id;
      const accessControlService = new AccessControlService();
      const resourceId = req.params.id ? parseInt(req.params.id) : undefined;

      const result = await accessControlService.simulateAction(
        userId,
        module,
        action,
        resourceId
      );

      if (!result.allowed) {
        return res.status(403).json({
          error: 'Access denied',
          details: {
            required: result.requiredPermission,
            user: result.user?.username,
            userPermissions: result.userPermissions.map(p => ({
              action: p.action,
              module: p.module.name
            })),
            opaDetails: result.opaDetails
          }
        });
      }

      // Attach evaluation results to request for potential use in handlers
      (req as any).opaEvaluation = result;
      next();
    } catch (error) {
      console.error('❌ Permission check with details failed:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};
