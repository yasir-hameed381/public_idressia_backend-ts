import { Router } from 'express';
import authMiddleware from '../../middlewares/authMiddleware';
import * as controller from '../../controllers/dutyType.controller';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getAllDutyTypes);
router.route('/active').get(controller.getActiveDutyTypes);
router.route('/add').post(controller.createDutyType);
router.route('/update/:id').put(controller.updateDutyType);
router.route('/:id').get(controller.getDutyTypeById).delete(controller.deleteDutyType);
export default router;
