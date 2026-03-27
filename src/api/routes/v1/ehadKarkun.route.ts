import { Router } from 'express';
import * as controller from '../../controllers/ehadKarkun.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.get('/', controller.getEhadKarkuns);
export default router;
