import { Router } from 'express';
import * as controller from '../../controllers/taleem.controller';
const router = Router();
router.get('/', controller.getTaleem);
export default router;
