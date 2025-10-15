import express from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { jwtAuth } from '../middleware/auth';
import { opaCheckPermission } from '../middleware/opa-check-permission';

const router = express.Router();
const permissionController = new PermissionController();

router.use(jwtAuth);

router.post('/', opaCheckPermission('Permissions', 'create'), (req, res) => permissionController.createPermission(req, res));
router.get('/', opaCheckPermission('Permissions', 'read'), (req, res) => permissionController.getPermissions(req, res));
router.get('/:id', opaCheckPermission('Permissions', 'read'), (req, res) => permissionController.getPermissionById(req, res));
router.get('/module/:moduleId', opaCheckPermission('Permissions', 'read'), (req, res) => permissionController.getPermissionsByModule(req, res));
router.put('/:id', opaCheckPermission('Permissions', 'update'), (req, res) => permissionController.updatePermission(req, res));
router.delete('/:id', opaCheckPermission('Permissions', 'delete'), (req, res) => permissionController.deletePermission(req, res));
router.post('/roles/:roleId/permissions', opaCheckPermission('Roles', 'update'), (req, res) => permissionController.assignPermissionToRoles(req, res));
router.delete('/roles/:roleId/permissions', opaCheckPermission('Roles', 'update'), (req, res) => permissionController.removeRolesFromPermission(req, res));

export default router;
