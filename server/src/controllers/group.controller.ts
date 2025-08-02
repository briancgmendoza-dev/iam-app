import { Request, Response } from 'express';
import { GroupService } from '../services/group.service';

export class GroupController {
  private groupService = new GroupService();

  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;

      if (!name || !/^\S(.*\S)?$/.test(name)) {
        res.status(400).json({ error: 'Group name must not start or end with whitespace' });
        return;
      }

      const group = await this.groupService.createGroup(name, description);
      res.status(201).json(group);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Group already exists') {
          res.status(409).json({ error: error.message }); // Conflict
        } else {
          res.status(500).json({ error: error.message }); // Server Error
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getAllGroups(req: Request, res: Response): Promise<void> {
    try {
      const groups = await this.groupService.getAllGroups();
      res.status(200).json(groups);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getGroupById(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseInt(req.params.id);

      if (isNaN(groupId) || !/^\d+$/.test(req.params.id)) {
        res.status(400).json({ error: 'Invalid group ID' });
        return;
      }

      const group = await this.groupService.getGroupById(groupId);
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }

      res.status(200).json(group);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async updateGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseInt(req.params.id);
      const { name, description } = req.body;

      if (isNaN(groupId) || !/^\d+$/.test(req.params.id)) {
        res.status(400).json({ error: 'Invalid group ID' });
        return;
      }

      if (!name || name.trim().length === 0) {
        res.status(400).json({ error: 'Group name is required' });
        return;
      }

      const updatedGroup = await this.groupService.updateGroup(groupId, name, description);
      res.status(200).json(updatedGroup);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Group not found') {
          res.status(404).json({ error: error.message });
        } else if (error.message === 'Group name already exists') {
          res.status(409).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseInt(req.params.id);

      if (isNaN(groupId) || !/^\d+$/.test(req.params.id)) {
        res.status(400).json({ error: 'Invalid group ID' });
        return;
      }

      await this.groupService.deleteGroup(groupId);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Group not found') {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getUsersByGroupId(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseInt(req.params.groupId);

      if (isNaN(groupId) || !/^\d+$/.test(req.params.groupId)) {
        res.status(400).json({ error: 'Invalid group ID' });
        return;
      }

      const users = await this.groupService.getUsersByGroupId(groupId);
      res.status(200).json(users);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Group not found') {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async assignUsersToGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseInt(req.params.groupId);
      const { userIds } = req.body;

      if (isNaN(groupId) || !/^\d+$/.test(req.params.groupId)) {
        res.status(400).json({ error: 'Invalid group ID' });
        return;
      }

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ error: 'User IDs array is required' });
        return;
      }

      const invalidIds = userIds.filter(id => !Number.isInteger(id) || id <= 0);
      if (invalidIds.length > 0) {
        res.status(400).json({ error: 'All user IDs must be positive integers' });
        return;
      }

      const updatedGroup = await this.groupService.assignUsersToGroup(groupId, userIds);
      res.status(200).json(updatedGroup);
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === 'Group not found' ||
          error.message === 'One or more users not found'
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

  async removeUsersFromGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseInt(req.params.groupId);
      const { userIds } = req.body;

      if (isNaN(groupId) || !/^\d+$/.test(req.params.groupId)) {
        res.status(400).json({ error: 'Invalid group ID' });
        return;
      }

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ error: 'User IDs array is required' });
        return;
      }

      const updatedGroup = await this.groupService.removeUsersFromGroup(groupId, userIds);
      res.status(200).json(updatedGroup);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Group not found') {
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
