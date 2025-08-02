import { Request, Response } from 'express';
import { RoleService } from '../services/role.service';
import { isNotNumeric, hasLeadingOrTrailingWhitespace } from '../utils';

export class RoleController {
  private roleService = new RoleService();

  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;

      if (!name || hasLeadingOrTrailingWhitespace(name)) {
        res.status(400).json({ error: 'Role name must not start or end with whitespace' });
        return;
      }

      const role = await this.roleService.createRole(name, description);

      res.status(201).json(role);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Role already exists') {
          res.status(409).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await this.roleService.getAllRoles();

      res.status(200).json(roles);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id);

      if (isNaN(roleId) || isNotNumeric(req.params.id)) {
        res.status(400).json({ error: 'Invalid role ID' });
        return;
      }

      const role = await this.roleService.getRoleById(roleId);
      if (!role) {
        res.status(404).json({ error: 'Role not found' });
        return;
      }

      res.status(200).json(role);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id);
      const { name, description } = req.body;

      if (isNaN(roleId) || isNotNumeric(req.params.id)) {
        res.status(400).json({ error: 'Invalid role ID' });
        return;
      }

      if (!name || hasLeadingOrTrailingWhitespace(name)) {
        res.status(400).json({ error: 'Role name must not start or end with whitespace' });
        return;
      }

      const updatedRole = await this.roleService.updateRole(roleId, name, description);

      res.status(200).json(updatedRole);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Role not found') {
          res.status(404).json({ error: error.message });
        } else if (error.message === 'Role name already exists') {
          res.status(409).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.id);

      if (isNaN(roleId) || isNotNumeric(req.params.id)) {
        res.status(400).json({ error: 'Invalid role ID' });
        return;
      }

      await this.roleService.deleteRole(roleId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Role not found') {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async assignRolesToGroup(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.roleId);
      const { groupIds } = req.body;

      if (isNaN(roleId) || isNotNumeric(req.params.roleId)) {
        res.status(400).json({ error: 'Invalid role ID' });
        return;
      }

      if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
        res.status(400).json({ error: 'Group IDs array is required' });
        return;
      }

      const invalidIds = groupIds.filter(id => !Number.isInteger(id) || id <= 0);
      if (invalidIds.length > 0) {
        res.status(400).json({ error: 'All group IDs must be positive integers' });
        return;
      }

      const updatedRole = await this.roleService.assignRolesToGroup(roleId, groupIds);

      res.status(200).json(updatedRole);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Role not found' ||
          error.message === 'One or more groups not found'
        ) {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async removeRolesFromGroup(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.roleId);
      const { groupIds } = req.body;

      if (isNaN(roleId) || isNotNumeric(req.params.roleId)) {
        res.status(400).json({ error: 'Invalid role ID' });
        return;
      }

      if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
        res.status(400).json({ error: 'Group IDs array is required' });
        return;
      }

      const updatedRole = await this.roleService.removeRolesFromGroup(roleId, groupIds);

      res.status(200).json(updatedRole);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Role not found') {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getGroupRoles(req: Request, res: Response): Promise<void> {
    try {
      const roleId = parseInt(req.params.roleId);

      if (isNaN(roleId) || isNotNumeric(req.params.roleId)) {
        res.status(400).json({ error: 'Invalid role ID' });
        return;
      }

      const groups = await this.roleService.getGroupRoles(roleId);

      res.status(200).json(groups);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Role not found') {
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
