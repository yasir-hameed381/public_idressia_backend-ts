import { Router } from 'express';
import * as controller from '../../controllers/naat.controller';
const router = Router();
router.get('/', controller.getNaatShareefs);
export default router;
