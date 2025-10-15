import express from 'express';
import { PolicyController } from '../controllers/policy.controller';
import { jwtAuth } from '../middleware/auth';
import { checkPermission as opaCheckPermission } from '../middleware/opa-permission';

const router = express.Router();
const policyController = new PolicyController();

// Public health check - no authentication required (must come BEFORE auth middleware)
router.get('/health', (req, res) => policyController.getHealth(req, res));

// Apply JWT authentication to all other routes
router.use(jwtAuth);

// Policy management routes - require authentication
router.get('/status', (req, res) => policyController.getStatus(req, res));

router.get('/metrics', opaCheckPermission('policies', 'read'), (req, res) =>
  policyController.getMetrics(req, res)
);

router.post('/test', opaCheckPermission('policies', 'create'), (req, res) =>
  policyController.testPolicy(req, res)
);

router.post('/batch-evaluate', opaCheckPermission('policies', 'create'), (req, res) =>
  policyController.batchEvaluate(req, res)
);

router.post('/clear-cache', opaCheckPermission('policies', 'delete'), (req, res) =>
  policyController.clearCache(req, res)
);export default router;
