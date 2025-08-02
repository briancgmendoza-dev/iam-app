import express from 'express';
import { GroupController } from '../controllers/group.controller';
import { jwtAuth } from '../middleware/auth';

const router = express.Router();
const groupController = new GroupController();

router.use(jwtAuth);

// Basic CRUD routes for groups
router.post('/', (req, res) => groupController.createGroup(req, res));
router.get('/', (req, res) => groupController.getAllGroups(req, res));
router.get('/:id', (req, res) => groupController.getGroupById(req, res));
router.put('/:id', (req, res) => groupController.updateGroup(req, res));
router.delete('/:id', (req, res) => groupController.deleteGroup(req, res));

// User-Group relationship routes
router.post('/:groupId/users', (req, res) => groupController.assignUsersToGroup(req, res));
router.delete('/:groupId/users', (req, res) => groupController.removeUsersFromGroup(req, res));
router.get('/:groupId/users', (req, res) => groupController.getUsersByGroupId(req, res));

export default router;
