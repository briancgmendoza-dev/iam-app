import express from 'express';
import { UserController } from '../controllers/user.controller';
import { jwtAuth } from '../middleware/auth';
import { opaCheckPermission } from '../middleware/opa-check-permission';

const router = express.Router();
const userController = new UserController();

router.use(jwtAuth);

// Apply OPA-based permission checks
router.get('/', opaCheckPermission('Users', 'read'), (req, res) => userController.getUsers(req, res));
router.get('/:id', opaCheckPermission('Users', 'read'), (req, res) => userController.getUserById(req, res));
router.put('/:id', opaCheckPermission('Users', 'update'), (req, res) => userController.updateUser(req, res));
router.delete('/:id', opaCheckPermission('Users', 'delete'), (req, res) => userController.deleteUser(req, res));

export default router;
