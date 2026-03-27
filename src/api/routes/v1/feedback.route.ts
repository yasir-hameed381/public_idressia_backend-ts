import { Router } from 'express';
import * as controller from '../../controllers/feedback.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.get('/', controller.getFeedback);
export default router;
