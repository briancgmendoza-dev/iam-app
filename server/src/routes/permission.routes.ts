import express from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { jwtAuth } from '../middleware/auth';
import { checkPermission } from '../middleware/check-permission';

const router = express.Router();
const permissionController = new PermissionController();

router.use(jwtAuth);

// Read
router.get('/', (req, res) => permissionController.getPermissions(req, res));
router.get('/:id', (req, res) => permissionController.getPermissionById(req, res));
router.get('/module/:moduleId', (req, res) =>
  permissionController.getPermissionsByModule(req, res)
);

// Write
router.post('/', checkPermission('Permissions', 'create'), (req, res) =>
  permissionController.createPermission(req, res)
);
router.put('/:id', checkPermission('Permissions', 'update'), (req, res) =>
  permissionController.updatePermission(req, res)
);
router.delete('/:id', checkPermission('Permissions', 'delete'), (req, res) =>
  permissionController.deletePermission(req, res)
);
router.post('/roles/:roleId/permissions', checkPermission('Roles', 'update'), (req, res) =>
  permissionController.assignPermissionToRoles(req, res)
);
router.delete('/roles/:roleId/permissions', checkPermission('Roles', 'delete'), (req, res) =>
  permissionController.removeRolesFromPermission(req, res)
);

export default router;
