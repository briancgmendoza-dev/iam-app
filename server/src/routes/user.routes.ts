import express from 'express';
import { UserController } from '../controllers/user.controller';
import { jwtAuth } from '../middleware/auth';
import { checkPermission } from '../middleware/check-permission';
import { checkPermission as opaCheckPermission, checkPermissionWithDetails } from '../middleware/opa-permission';

const router = express.Router();
const userController = new UserController();

router.use(jwtAuth);

// Read operations - using enhanced OPA middleware for detailed feedback
router.get('/', opaCheckPermission('users', 'read'), (req, res) =>
  userController.getUsers(req, res)
);
router.get('/:id', checkPermissionWithDetails('users', 'read'), (req, res) =>
  userController.getUserById(req, res)
);

// Write operations - using enhanced OPA middleware
router.put('/:id', checkPermissionWithDetails('users', 'update'), (req, res) =>
  userController.updateUser(req, res)
);
router.delete('/:id', checkPermissionWithDetails('users', 'delete'), (req, res) =>
  userController.deleteUser(req, res)
);

export default router;
