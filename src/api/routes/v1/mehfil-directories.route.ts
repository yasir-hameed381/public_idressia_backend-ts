import { Router } from 'express';
import * as controller from '../../controllers/mehfil-directories.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getMehfilDirections);
router.route('/add').post(controller.createMehfilDirection);
router.route('/update/:id').put(controller.updateMehfilDirection);
router.route('/:id').delete(controller.deleteMehfilDirection);
router.route('/:id').get(controller.getDirectionById);
export default router;
