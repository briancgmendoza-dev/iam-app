import express from 'express';
import { RoleController } from '../controllers/role.controller';
import { jwtAuth } from '../middleware/auth';
import { checkPermission } from '../middleware/check-permission';

const router = express.Router();
const roleController = new RoleController();

router.use(jwtAuth);

// Read
router.get('/', (req, res) => roleController.getRoles(req, res));
router.get('/:id', (req, res) => roleController.getRoleById(req, res));
router.get('/:roleId/groups', (req, res) => roleController.getRoleGroups(req, res));
router.get('/:roleId/permissions', (req, res) => roleController.getRolePermissions(req, res));

// Write
router.post('/', checkPermission('Roles', 'create'), (req, res) =>
  roleController.createRole(req, res)
);
router.put('/:id', checkPermission('Roles', 'update'), (req, res) =>
  roleController.updateRole(req, res)
);
router.delete('/:id', checkPermission('Roles', 'delete'), (req, res) =>
  roleController.deleteRole(req, res)
);

// Role-Group relationship routes
router.post('/:roleId/groups', checkPermission('Roles', 'update'), (req, res) =>
  roleController.assignGroupsToRole(req, res)
);
router.delete('/:roleId/groups', checkPermission('Roles', 'delete'), (req, res) =>
  roleController.removeGroupsFromRole(req, res)
);

// Role-Permission relationship routes
router.post('/:roleId/permissions', checkPermission('Roles', 'update'), (req, res) =>
  roleController.assignPermissionsToRole(req, res)
);
router.delete('/:roleId/permissions', checkPermission('Roles', 'delete'), (req, res) =>
  roleController.removePermissionsFromRole(req, res)
);

export default router;
