import { Router } from 'express';
import * as controller from '../../controllers/wazaifs.controller';
const router = Router();
router.get('/', controller.getWazaifs);
export default router;
