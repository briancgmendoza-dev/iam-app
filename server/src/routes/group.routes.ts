import express from 'express';
import { GroupController } from '../controllers/group.controller';
import { jwtAuth } from '../middleware/auth';
import { opaCheckPermission } from '../middleware/opa-check-permission';

const router = express.Router();
const groupController = new GroupController();

router.use(jwtAuth);

router.post('/', opaCheckPermission('Groups', 'create'), (req, res) => groupController.createGroup(req, res));
router.get('/', opaCheckPermission('Groups', 'read'), (req, res) => groupController.getAllGroups(req, res));
router.get('/:id', opaCheckPermission('Groups', 'read'), (req, res) => groupController.getGroupById(req, res));
router.get('/:groupId/users', opaCheckPermission('Groups', 'read'), (req, res) => groupController.getUsersByGroupId(req, res));
router.put('/:id', opaCheckPermission('Groups', 'update'), (req, res) => groupController.updateGroup(req, res));
router.delete('/:id', opaCheckPermission('Groups', 'delete'), (req, res) => groupController.deleteGroup(req, res));
router.post('/:groupId/users', opaCheckPermission('Groups', 'update'), (req, res) => groupController.assignUsersToGroup(req, res));
router.delete('/:groupId/users', opaCheckPermission('Groups', 'update'), (req, res) => groupController.removeUsersFromGroup(req, res));

export default router;
