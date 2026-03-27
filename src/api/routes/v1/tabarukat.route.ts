import { Router } from 'express';
import * as controller from '../../controllers/tabarukat.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getTabarukat);
router.route('/:id').get(controller.getTabarukatById);
export default router;
