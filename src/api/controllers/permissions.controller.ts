import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as permissionsService from '../services/permissionsService';

export const getPermissions = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const permissions = await permissionsService.getPermissions();
    return res.json(permissions);
  } catch (error) {
    logger.error('Error fetching permissions:', error);
    return next(error);
  }
};
