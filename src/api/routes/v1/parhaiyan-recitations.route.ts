import { Router } from 'express';
import * as controller from '../../controllers/parhaiyan_recitations.controller';

const router = Router();
router.route('/').get(controller.getParhaiyanRecitations);
router.route('/add').post(controller.addParhaiyanRecitation);
router.route('/:id').delete(controller.deleteParhaiyanRecitation);
export default router;
