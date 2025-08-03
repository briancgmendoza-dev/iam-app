import { Request, Response } from 'express';
import { ModuleService } from '../services/module.service';
import { isNotNumeric, hasLeadingOrTrailingWhitespace } from '../utils';

export class ModuleController {
  private moduleService = new ModuleService();

  async createModule(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;

      if (!name || hasLeadingOrTrailingWhitespace(name)) {
        res.status(400).json({
          error: hasLeadingOrTrailingWhitespace(name)
            ? 'Module name must not start or end with whitespace'
            : 'Module name is required',
        });
        return;
      }

      const module = await this.moduleService.createModule(name, description);

      res.status(201).json(module);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Module already exists') {
          res.status(409).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getModules(req: Request, res: Response): Promise<void> {
    try {
      const modules = await this.moduleService.getAllModules();

      res.status(200).json(modules);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async getModuleById(req: Request, res: Response): Promise<void> {
    try {
      const moduleId = parseInt(req.params.id);

      if (isNaN(moduleId) || isNotNumeric(req.params.id)) {
        res.status(400).json({ error: 'Invalid module ID' });
        return;
      }

      const module = await this.moduleService.getModuleById(moduleId);
      if (!module) {
        res.status(404).json({ error: 'Module not found' });
        return;
      }

      res.status(200).json(module);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async updateModule(req: Request, res: Response): Promise<void> {
    try {
      const moduleId = parseInt(req.params.id);
      const { name, description } = req.body;

      if (isNaN(moduleId) || isNotNumeric(req.params.id)) {
        res.status(400).json({ error: 'Invalid module ID' });
        return;
      }

      if (!name || hasLeadingOrTrailingWhitespace(name)) {
        res.status(400).json({
          error: hasLeadingOrTrailingWhitespace(name)
            ? 'Module name must not start or end with whitespace'
            : 'Module name is required',
        });
        return;
      }

      const updatedModule = await this.moduleService.updateModule(moduleId, name, description);

      res.status(200).json(updatedModule);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Module not found') {
          res.status(404).json({ error: error.message });
        } else if (error.message === 'Module name already exists') {
          res.status(409).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }

  async deleteModule(req: Request, res: Response): Promise<void> {
    try {
      const moduleId = parseInt(req.params.id);

      if (isNaN(moduleId) || isNotNumeric(req.params.id)) {
        res.status(400).json({ error: 'Invalid module ID' });
        return;
      }

      await this.moduleService.deleteModule(moduleId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Module not found') {
          res.status(404).json({ error: error.message });
        } else if (error.message === 'Cannot delete module that has permissions assigned') {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  }
}
