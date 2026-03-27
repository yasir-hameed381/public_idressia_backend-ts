import { Router } from 'express';
import authMiddleware from '../../middlewares/authMiddleware';
import * as controller from '../../controllers/karkun.controller';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getKarkun);
router.route('/add').post(controller.createKarkun);
router.route('/update/:id').put(controller.updateKarkun);
router.route('/:id').get(controller.getKarkunById).delete(controller.deleteKarkun);
export default router;
