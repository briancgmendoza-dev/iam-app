import express from 'express';
import { OPAController } from '../controllers/opa.controller';
import { jwtAuth } from '../middleware/auth';
import { opaCheckPermission } from '../middleware/opa-check-permission';

const router = express.Router();
const opaController = new OPAController();

router.use(jwtAuth);

router.get('/health', opaCheckPermission('System', 'read'), (req, res) => opaController.healthCheck(req, res));
router.post('/reload-policy', opaCheckPermission('System', 'update'), (req, res) => opaController.reloadPolicy(req, res));

export default router;
