import express from 'express';
import { AccessControlController } from '../controllers/access-control.controller';
import { jwtAuth } from '../middleware/auth';

const router = express.Router();
const accessControlController = new AccessControlController();

router.use(jwtAuth);

router.post('/:id/permissions', (req, res) => accessControlController.getMyPermissions(req, res));
router.post('/simulate-action', (req, res) => accessControlController.simulateAction(req, res));

export default router;
