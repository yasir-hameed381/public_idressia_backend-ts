import { Router } from 'express';
import * as controller from '../../controllers/permissions.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.get('/', controller.getPermissions);
export default router;
