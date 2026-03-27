import { Router } from 'express';
import authMiddleware from '../../middlewares/authMiddleware';
import * as controller from '../../controllers/newEhadFollowUp.controller';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getAllFollowUps);
router.route('/new-ehad/:newEhadId').get(controller.getFollowUpsByNewEhad);
router.route('/add').post(controller.createFollowUp);
router.route('/update/:id').put(controller.updateFollowUp);
router.route('/:id').get(controller.getFollowUpById).delete(controller.deleteFollowUp);
export default router;
