import { Router } from 'express';
import * as controller from '../../controllers/tags.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.route('/').get(controller.getTags);
router.route('/:id').get(controller.getTagsById);
export default router;
