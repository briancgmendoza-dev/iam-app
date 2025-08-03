import { Request, Response } from 'express';
import { PermissionService } from '../services/permission.service';
import { isNotNumeric, hasLeadingOrTrailingWhitespace } from '../utils';

export class PermissionController {
  private permissionService = new PermissionService();

  async createPermission(req: Request, res: Response): Promise<void> {
    try {
      const { action, moduleId } = req.body;

      if (!action || hasLeadingOrTrailingWhitespace(action)) {
        res.status(400).json({
          error: hasLeadingOrTrailingWhitespace(action)
            ? 'Permission action must not start or end with whitespace'
            : 'Permission action is required',
        });
        return;
      }

      if (!moduleId || isNaN(moduleId) || isNotNumeric(moduleId.toString())) {
        res.status(400).json({ error: 'Valid module ID is required' });
        return;
      }

      const permission = await this.permissionService.createPermission(action, moduleId);

      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Permission already exists for this module and action') {
          res.status(409).json({ error: error.message });
        } else if (error.message === 'Module not found') {
          res.status(404).json({ error: error.message });
        } else if (error.message.includes('Invalid action')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await this.permissionService.getAllPermissions();

      res.status(200).json(permissions);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getPermissionById(req: Request, res: Response): Promise<void> {
    try {
      const permissionId = parseInt(req.params.id);

      if (isNaN(permissionId) || isNotNumeric(req.params.id)) {
        res.status(400).json({ error: 'Invalid permission ID' });
        return;
      }

      const permission = await this.permissionService.getPermissionById(permissionId);
      if (!permission) {
        res.status(404).json({ error: 'Permission not found' });
        return;
      }

      res.status(200).json(permission);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async updatePermission(req: Request, res: Response): Promise<void> {
    try {
      const permissionId = parseInt(req.params.id);
      const { action, moduleId } = req.body;

      if (isNaN(permissionId) || isNotNumeric(req.params.id)) {
        res.status(400).json({ error: 'Invalid permission ID' });
        return;
      }

      if (!action || hasLeadingOrTrailingWhitespace(action)) {
        res.status(400).json({
          error: hasLeadingOrTrailingWhitespace(action)
            ? 'Permission action must not start or end with whitespace'
            : 'Permission action is required',
        });
        return;
      }

      if (!moduleId || isNaN(moduleId) || isNotNumeric(moduleId.toString())) {
        res.status(400).json({ error: 'Valid module ID is required' });
        return;
      }

      const updatedPermission = await this.permissionService.updatePermission(
        permissionId,
        action,
        moduleId
      );

      res.status(200).json(updatedPermission);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Permission not found' || error.message === 'Module not found') {
          res.status(404).json({ error: error.message });
        } else if (error.message === 'Permission already exists for this module and action') {
          res.status(409).json({ error: error.message });
        } else if (
          error.message.includes('Invalid action') ||
          error.message.includes('Invalid module ID')
        ) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async deletePermission(req: Request, res: Response): Promise<void> {
    try {
      const permissionId = parseInt(req.params.id);

      if (isNaN(permissionId) || isNotNumeric(req.params.id)) {
        res.status(400).json({ error: 'Invalid permission ID' });
        return;
      }

      await this.permissionService.deletePermission(permissionId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Permission not found') {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getPermissionsByModule(req: Request, res: Response): Promise<void> {
    try {
      const moduleId = parseInt(req.params.moduleId);

      if (isNaN(moduleId) || isNotNumeric(req.params.moduleId)) {
        res.status(400).json({ error: 'Invalid module ID' });
        return;
      }

      const permissions = await this.permissionService.getPermissionsByModule(moduleId);

      res.status(200).json(permissions);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async assignPermissionToRoles(req: Request, res: Response): Promise<void> {
    try {
      const permissionId = parseInt(req.params.permissionId);
      const roleIds: number[] = req.body.roleIds;

      if (isNaN(permissionId) || isNotNumeric(req.params.permissionId)) {
        res.status(400).json({ error: 'Invalid permission ID' });
        return;
      }

      if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
        res.status(400).json({ error: 'Role IDs are required' });
        return;
      }

      const updatedPermission = await this.permissionService.assignPermissionToRoles(
        permissionId,
        roleIds
      );

      res.status(200).json(updatedPermission);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Permission not found') {
          res.status(404).json({ error: error.message });
        } else if (error.message === 'One or more roles not found') {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async removeRolesFromPermission(req: Request, res: Response): Promise<void> {
    try {
      const permissionId = parseInt(req.params.permissionId);
      const roleIds: number[] = req.body.roleIds;

      if (isNaN(permissionId) || isNotNumeric(req.params.permissionId)) {
        res.status(400).json({ error: 'Invalid permission ID' });
        return;
      }

      if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
        res.status(400).json({ error: 'Role IDs are required' });
        return;
      }

      const updatedPermission = await this.permissionService.removeRolesFromPermission(
        permissionId,
        roleIds
      );

      res.status(200).json(updatedPermission);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Permission not found') {
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
