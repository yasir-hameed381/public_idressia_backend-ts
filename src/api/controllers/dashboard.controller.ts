import { Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as dashboardService from '../services/dashboardService';
import * as authService from '../services/authService';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { selected_month, selected_year, selected_zone_id, selected_mehfil_id } = req.query;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const user = await authService.getUserWithPermissions(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!selected_month || !selected_year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }
    const filters = {
      selectedMonth: parseInt(String(selected_month)),
      selectedYear: parseInt(String(selected_year)),
      selectedZoneId: selected_zone_id ? parseInt(String(selected_zone_id)) : null,
      selectedMehfilId: selected_mehfil_id ? parseInt(String(selected_mehfil_id)) : null,
    };
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    const stats = await dashboardService.getDashboardStats(filters, user);
    return res.json(stats);
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    return next(error);
  }
};

export const getOverallTotals = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    const totals = await dashboardService.getOverallTotals();
    return res.json(totals);
  } catch (error) {
    logger.error('Error fetching overall totals:', error);
    return next(error);
  }
};

export const getZonesForUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    const user = await authService.getUserWithPermissions(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const zones = await dashboardService.getZonesForUser(user);
    return res.json({ success: true, data: zones });
  } catch (error) {
    logger.error('Error fetching zones for user:', error);
    return next(error);
  }
};

export const getMehfilsForZone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { zone_id } = req.params;
    if (!zone_id) {
      return res.status(400).json({ success: false, message: 'Zone ID is required' });
    }
    const mehfils = await dashboardService.getMehfilsForZone(parseInt(zone_id, 10));
    return res.json({ success: true, data: mehfils });
  } catch (error) {
    logger.error('Error fetching mehfils for zone:', error);
    return next(error);
  }
};
