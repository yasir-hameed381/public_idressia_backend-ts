import { Router } from 'express';
import * as controller from '../../controllers/zone.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getZones);
router.route('/add').post(controller.createZone);
router.route('/update/:id').put(controller.updateZone);
router.route('/:id').delete(controller.deleteZone);
router.route('/:id').get(controller.getZoneById);
export default router;
