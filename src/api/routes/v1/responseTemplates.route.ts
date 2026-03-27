import { Router } from 'express';
import * as controller from '../../controllers/responseTemplates.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.get('/', controller.getResponseTemplates);
export default router;
