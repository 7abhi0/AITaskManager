import { Router } from 'express';
import { AuthController, registerSchema, loginSchema } from '../controllers/AuthController';
import { validateRequest } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new AuthController();

router.post('/register', validateRequest(registerSchema), controller.register);
router.post('/login', validateRequest(loginSchema), controller.login);
router.get('/me', authenticate, controller.me);

export default router;
