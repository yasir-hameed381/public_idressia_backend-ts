import { Router } from 'express';
import * as controller from '../../controllers/namaz.controller';
const router = Router();
router.get('/', controller.getNamazTimings);
export default router;
