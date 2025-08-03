import express from 'express';
import { UserController } from '../controllers/user.controller';
import { jwtAuth } from '../middleware/auth';
import { checkPermission } from '../middleware/check-permission';

const router = express.Router();
const userController = new UserController();

router.use(jwtAuth);
// Read
router.get('/', (req, res) => userController.getUsers(req, res));
router.get('/:id', (req, res) => userController.getUserById(req, res));

// Write
router.put('/:id', checkPermission('user', 'update'), (req, res) =>
  userController.updateUser(req, res)
);
router.delete('/:id', checkPermission('user', 'delete'), (req, res) =>
  userController.deleteUser(req, res)
);

export default router;
