import { Router } from 'express';
import * as controller from '../../controllers/search.controller';

const router = Router();
router.route('/').get(controller.search);
export default router;
