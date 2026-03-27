import { Router } from 'express';
import * as controller from '../../controllers/khat.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.get('/', controller.getKhats);
export default router;
