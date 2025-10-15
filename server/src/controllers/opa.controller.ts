import { Request, Response } from 'express';
import { OPAService } from '../services/opa.service';

export class OPAController {
  private opaService = new OPAService();

  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Simple policy evaluation to check if OPA is working
      const testInput = {
        user: { id: 1, username: 'test', groups: [] },
        action: 'read',
        resource: { module: 'test' }
      };

      await this.opaService.evaluate(testInput);
      res.status(200).json({ status: 'OPA is healthy', timestamp: new Date() });
    } catch (error) {
      res.status(500).json({
        status: 'OPA is unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  async reloadPolicy(req: Request, res: Response): Promise<void> {
    try {
      await this.opaService.initialize();
      res.status(200).json({ message: 'Policy reloaded successfully' });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to reload policy',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
