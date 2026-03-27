import { Router } from 'express';
import authMiddleware from '../../middlewares/authMiddleware';
import * as controller from '../../controllers/dutyRoster.controller';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getAllDutyRosters);
router.route('/add').post(controller.createDutyRoster);
router.route('/add-duty').post(controller.addDuty);
router.route('/remove-duty/:id').delete(controller.removeDuty);
router.route('/karkun/:ehadKarkunId').get(controller.getDutyRosterByKarkun);
router.route('/update/:id').put(controller.updateDutyRoster);
router.route('/available-karkuns').get(controller.getAvailableKarkuns);
router.route('/:id').get(controller.getDutyRosterById).delete(controller.deleteDutyRoster);
export default router;
