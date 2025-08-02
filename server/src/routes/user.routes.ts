import express from 'express';
import { UserController } from '../controllers/user.controller';
import { jwtAuth } from '../middleware/auth';

const router = express.Router();
const userController = new UserController();

router.use(jwtAuth);
router.get('/', (req, res) => userController.getUsers(req, res));
router.get('/:id', (req, res) => userController.getUser(req, res));
router.put('/:id', (req, res) => userController.updateUser(req, res));
router.delete('/:id', (req, res) => userController.deleteUser(req, res));

export default router;
