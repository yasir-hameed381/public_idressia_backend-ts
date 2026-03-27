import { Router } from 'express';
import * as controller from '../../controllers/mehfilReports.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.get('/', controller.getMehfilReports);
export default router;
