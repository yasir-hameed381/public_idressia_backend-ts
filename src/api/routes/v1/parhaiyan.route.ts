import { Router } from 'express';
import * as controller from '../../controllers/parhaiyan.controller';

const router = Router();
router.get('/', controller.getParhaiyans);
router.get('/active', controller.activeParhaiyans);
export default router;
