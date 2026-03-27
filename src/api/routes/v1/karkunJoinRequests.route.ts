import { Router } from 'express';
import authMiddleware from '../../middlewares/authMiddleware';
import * as controller from '../../controllers/karkunJoinRequests.controller';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getKarkunJoinRequests);
router.route('/add').post(controller.createKarkunJoinRequest);
router.route('/update/:id').put(controller.updateKarkunJoinRequest);
router.route('/:id').get(controller.getKarkunJoinRequestById).delete(controller.deleteKarkunJoinRequest);
export default router;
