import { Router } from 'express';
import * as controller from '../../controllers/mehfils.controller';
const router = Router();
router.get('/', controller.getMehfils);
export default router;
