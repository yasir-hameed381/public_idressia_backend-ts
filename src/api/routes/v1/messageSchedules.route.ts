import { Router } from 'express';
import authMiddleware from '../../middlewares/authMiddleware';
import * as controller from '../../controllers/messageSchedules.controller';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getMessageSchedules).post(controller.createMessageSchedule);
router.route('/update/:id').put(controller.updateMessageSchedule);
router.route('/:id').get(controller.getMessageScheduleById).delete(controller.deleteMessageSchedule);
export default router;
