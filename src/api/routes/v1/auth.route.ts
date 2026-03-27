import { Router } from 'express';
import * as controller from '../../controllers/auth.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();

router.route('/login').post(controller.login);
router.route('/register').post(controller.register);
router.route('/user').get(authMiddleware, controller.getCurrentUser);
router.route('/profile').put(authMiddleware, controller.updateProfile);
router.route('/password').put(authMiddleware, controller.updatePassword);

export default router;
