import { Router } from 'express';
import * as controller from '../../controllers/region.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getRegions);
router.route('/add').post(controller.createRegion);
router.route('/update/:id').put(controller.updateRegion);
router.route('/:id').delete(controller.deleteRegion);
router.route('/:id').get(controller.getRegionById);
export default router;
