import express from 'express';
import { ModuleController } from '../controllers/module.controller';
import { jwtAuth } from '../middleware/auth';
import { opaCheckPermission } from '../middleware/opa-check-permission';

const router = express.Router();
const moduleController = new ModuleController();

router.use(jwtAuth);

router.post('/', opaCheckPermission('Modules', 'create'), (req, res) => moduleController.createModule(req, res));
router.get('/', opaCheckPermission('Modules', 'read'), (req, res) => moduleController.getModules(req, res));
router.get('/:id', opaCheckPermission('Modules', 'read'), (req, res) => moduleController.getModuleById(req, res));
router.put('/:id', opaCheckPermission('Modules', 'update'), (req, res) => moduleController.updateModule(req, res));
router.delete('/:id', opaCheckPermission('Modules', 'delete'), (req, res) => moduleController.deleteModule(req, res));

export default router;
