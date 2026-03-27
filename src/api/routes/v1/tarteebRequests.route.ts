import { Router } from 'express';
import * as controller from '../../controllers/tarteebRequests.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.get('/', controller.getTarteebRequests);
export default router;
