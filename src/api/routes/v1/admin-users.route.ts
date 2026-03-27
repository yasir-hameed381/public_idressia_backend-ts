import { Router } from 'express';
import * as controller from '../../controllers/adminUsers.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getAdminUsers);
router.route('/add').post(controller.createAdminUser);
router.route('/:id').get(controller.getAdminUserById);
router.route('/:id').delete(controller.deleteAdminUser);
router.route('/update/:id').put(controller.updateAdminUser);

export default router;
