import { Router } from 'express';
import { UserController, updateUserSchema } from '../controllers/UserController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();
const controller = new UserController();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'TEAM_LEAD'), controller.getAllUsers);
router.put('/:id', validateRequest(updateUserSchema), controller.updateProfile);
router.delete('/:id', authorize('ADMIN'), controller.deleteUser);

export default router;
