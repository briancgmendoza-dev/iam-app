import express from 'express';
import { RoleController } from '../controllers/role.controller';
import { jwtAuth } from '../middleware/auth';

const router = express.Router();
const roleController = new RoleController();

router.use(jwtAuth);

// Basic CRUD routes for roles
router.post('/', (req, res) => roleController.createRole(req, res));
router.get('/', (req, res) => roleController.getRoles(req, res));
router.get('/:id', (req, res) => roleController.getRoleById(req, res));
router.put('/:id', (req, res) => roleController.updateRole(req, res));
router.delete('/:id', (req, res) => roleController.deleteRole(req, res));

// Role-Group relationship routes
router.post('/:roleId/groups', (req, res) => roleController.assignRolesToGroup(req, res));
router.delete('/:roleId/groups', (req, res) => roleController.removeRolesFromGroup(req, res));
router.get('/:roleId/groups', (req, res) => roleController.getGroupRoles(req, res));

export default router;
