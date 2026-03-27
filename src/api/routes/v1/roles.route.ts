import { Router } from 'express';
import * as controller from '../../controllers/roles.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();
router.use(authMiddleware);
router.get('/', controller.getRoles);
router.post('/add', controller.createRole);
router.put('/update/:id', controller.updateRole);
router.get('/:id', controller.getRoleById);
router.delete('/:id', controller.deleteRole);
export default router;
