import { Router } from 'express';
import authMiddleware from '../../middlewares/authMiddleware';
import * as controller from '../../controllers/mehfilCoordinator.controller';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getAllCoordinators);
router.route('/active/:mehfilDirectoryId').get(controller.getActiveCoordinatorsByMehfil);
router.route('/add').post(controller.createCoordinator);
router.route('/update/:id').put(controller.updateCoordinator);
router.route('/:id').get(controller.getCoordinatorById).delete(controller.deleteCoordinator);
export default router;
