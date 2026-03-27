import { Router } from 'express';
import * as controller from '../../controllers/newKarkun.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.get('/', controller.getKarkuns);
export default router;
