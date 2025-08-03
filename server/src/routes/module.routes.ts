import express from 'express';
import { ModuleController } from '../controllers/module.controller';
import { jwtAuth } from '../middleware/auth';
import { checkPermission } from '../middleware/check-permission';

const router = express.Router();
const moduleController = new ModuleController();

router.use(jwtAuth);

// Read
router.get('/', (req, res) => moduleController.getModules(req, res));
router.get('/:id', (req, res) => moduleController.getModule(req, res));

// Write
router.post('/', checkPermission('Modules', 'create'), (req, res) =>
  moduleController.createModule(req, res)
);
router.put('/:id', checkPermission('Modules', 'update'), (req, res) =>
  moduleController.updateModule(req, res)
);
router.delete('/:id', checkPermission('Modules', 'delete'), (req, res) =>
  moduleController.deleteModule(req, res)
);

export default router;
