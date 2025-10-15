import express from 'express';
import { RoleController } from '../controllers/role.controller';
import { jwtAuth } from '../middleware/auth';
import { opaCheckPermission } from '../middleware/opa-check-permission';

const router = express.Router();
const roleController = new RoleController();

router.use(jwtAuth);

router.post('/', opaCheckPermission('Roles', 'create'), (req, res) => roleController.createRole(req, res));
router.get('/', opaCheckPermission('Roles', 'read'), (req, res) => roleController.getRoles(req, res));
router.get('/:id', opaCheckPermission('Roles', 'read'), (req, res) => roleController.getRoleById(req, res));
router.get('/:roleId/groups', opaCheckPermission('Roles', 'read'), (req, res) => roleController.getRoleGroups(req, res));
router.get('/:roleId/permissions', opaCheckPermission('Roles', 'read'), (req, res) => roleController.getRolePermissions(req, res));
router.put('/:id', opaCheckPermission('Roles', 'update'), (req, res) => roleController.updateRole(req, res));
router.delete('/:id', opaCheckPermission('Roles', 'delete'), (req, res) => roleController.deleteRole(req, res));
router.post('/:roleId/groups', opaCheckPermission('Roles', 'update'), (req, res) => roleController.assignGroupsToRole(req, res));
router.delete('/:roleId/groups', opaCheckPermission('Roles', 'update'), (req, res) => roleController.removeGroupsFromRole(req, res));
router.post('/:roleId/permissions', opaCheckPermission('Roles', 'update'), (req, res) => roleController.assignPermissionsToRole(req, res));
router.delete('/:roleId/permissions', opaCheckPermission('Roles', 'update'), (req, res) => roleController.removePermissionsFromRole(req, res));

export default router;
