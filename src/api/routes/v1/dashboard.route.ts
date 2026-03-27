import { Router } from 'express';
import * as dashboardController from '../../controllers/dashboard.controller';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();

router.get('/stats', authMiddleware, dashboardController.getDashboardStats);
router.get('/overall-totals', authMiddleware, dashboardController.getOverallTotals);
router.get('/zones', authMiddleware, dashboardController.getZonesForUser);
router.get('/mehfils/:zone_id', authMiddleware, dashboardController.getMehfilsForZone);

export default router;
