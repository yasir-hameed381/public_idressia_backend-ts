import { Router } from 'express';
import * as controller from '../../controllers/messages.controller';
const router = Router();
router.get('/', controller.getMessages);
export default router;
