import { Request, Response } from 'express';
import { opaService } from '../services/opa.service';

export class PolicyController {

  /**
   * Public health check endpoint - no authentication required
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const isHealthy = opaService.isInitialized();
      const status = {
        initialized: isHealthy,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        service: {
          initialized: isHealthy,
          version: '1.0.0',
          timestamp: new Date().toISOString()
        }
      };

      res.status(isHealthy ? 200 : 503).json(status);
    } catch (error) {
      res.status(500).json({
        initialized: false,
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get comprehensive OPA service status for monitoring
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const metrics = opaService.getMetrics();

      const status = {
        service: {
          initialized: opaService.isInitialized(),
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        },
        performance: {
          totalEvaluations: metrics.totalEvaluations,
          averageEvaluationTime: Math.round(metrics.averageEvaluationTime * 100) / 100,
          cacheHitRate: metrics.totalEvaluations > 0
            ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100) / 100
            : 0,
          errorRate: metrics.totalEvaluations > 0
            ? Math.round((metrics.errors / metrics.totalEvaluations) * 100) / 100
            : 0
        },
        health: {
          status: opaService.isInitialized() ? 'healthy' : 'unhealthy',
          lastError: metrics.lastError || null,
          checks: {
            initialization: opaService.isInitialized(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
          }
        }
      };

      const httpStatus = status.health.status === 'healthy' ? 200 : 503;
      res.status(httpStatus).json(status);

    } catch (error) {
      res.status(500).json({
        error: 'Failed to get OPA status',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Test OPA policy evaluation with sample data
   */
  async testPolicy(req: Request, res: Response): Promise<void> {
    try {
      const { user, resource, action } = req.body;

      if (!user || !resource || !action) {
        res.status(400).json({
          error: 'Missing required fields: user, resource, action'
        });
        return;
      }

      if (!opaService.isInitialized()) {
        res.status(503).json({
          error: 'OPA Service not initialized'
        });
        return;
      }

      const evaluation = await opaService.evaluateWithDetails({
        user,
        resource,
        action
      });

      res.status(200).json({
        input: { user, resource, action },
        evaluation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Policy evaluation failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Evaluate multiple policies at once with production safeguards
   */
  async batchEvaluate(req: Request, res: Response): Promise<void> {
    try {
      const { requests } = req.body;

      // Input validation
      if (!Array.isArray(requests)) {
        res.status(400).json({
          error: 'requests must be an array of evaluation requests'
        });
        return;
      }

      // Batch size limit for performance
      const maxBatchSize = 100;
      if (requests.length > maxBatchSize) {
        res.status(400).json({
          error: `Batch size exceeds maximum of ${maxBatchSize} requests`
        });
        return;
      }

      if (!opaService.isInitialized()) {
        res.status(503).json({
          error: 'OPA Service not initialized'
        });
        return;
      }

      const startTime = Date.now();

      // Process requests with timeout
      const results = await Promise.allSettled(
        requests.map(async (request, index) => {
          try {
            // Individual request timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Request timeout')), 5000);
            });

            const evaluationPromise = opaService.evaluateWithDetails(request);

            const evaluation = await Promise.race([evaluationPromise, timeoutPromise]);

            return {
              index,
              input: request,
              evaluation,
              success: true,
              processingTime: Date.now() - startTime
            };
          } catch (error) {
            return {
              index,
              input: request,
              error: error instanceof Error ? error.message : String(error),
              success: false,
              processingTime: Date.now() - startTime
            };
          }
        })
      );

      const processedResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            index,
            input: requests[index],
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
            success: false,
            processingTime: Date.now() - startTime
          };
        }
      });

      const summary = {
        total: processedResults.length,
        successful: processedResults.filter(r => r.success).length,
        failed: processedResults.filter(r => !r.success).length,
        totalProcessingTime: Date.now() - startTime,
        averageProcessingTime: (Date.now() - startTime) / processedResults.length
      };

      res.status(200).json({
        results: processedResults,
        summary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Batch evaluation failed',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Clear policy cache - for policy updates
   */
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      opaService.clearCache();

      res.status(200).json({
        message: 'Policy cache cleared successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to clear cache',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get detailed metrics for monitoring dashboard
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = opaService.getMetrics();

      res.status(200).json({
        metrics,
        system: {
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to get metrics',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }
}
