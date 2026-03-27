import { Router } from 'express';
import * as controller from '../../controllers/categories.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getCategories);
router.route('/add').post(controller.createCategory);
router.route('/:id').delete(controller.deleteCategory);
router.route('/update/:id').put(controller.updateCategory);

export default router;
