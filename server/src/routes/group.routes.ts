import express from 'express';
import { GroupController } from '../controllers/group.controller';
import { jwtAuth } from '../middleware/auth';
import { checkPermission } from '../middleware/check-permission';

const router = express.Router();
const groupController = new GroupController();

router.use(jwtAuth);

// Read
router.get('/', (req, res) => groupController.getAllGroups(req, res));
router.get('/:id', (req, res) => groupController.getGroupById(req, res));
router.get('/:groupId/users', (req, res) => groupController.getUsersByGroupId(req, res));

// Write
router.post('/', checkPermission('Groups', 'create'), (req, res) =>
  groupController.createGroup(req, res)
);
router.put('/:id', checkPermission('Groups', 'update'), (req, res) =>
  groupController.updateGroup(req, res)
);
router.delete('/:id', checkPermission('Groups', 'delete'), (req, res) =>
  groupController.deleteGroup(req, res)
);

// User-Group relationship routes
router.post('/:groupId/users', checkPermission('Groups', 'update'), (req, res) =>
  groupController.assignUsersToGroup(req, res)
);
router.delete('/:groupId/users', checkPermission('Groups', 'delete'), (req, res) =>
  groupController.removeUsersFromGroup(req, res)
);

export default router;
