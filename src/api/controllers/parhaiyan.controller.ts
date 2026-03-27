import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as parhaiyanService from '../services/parhaiyanService';

export const getParhaiyans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await parhaiyanService.getParhaiyans({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      search: req.query.search as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching parhaiyan:', error);
    return next(error);
  }
};

export const activeParhaiyans = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await parhaiyanService.activeParhaiyan();
    return res.json(result);
  } catch (error) {
    logger.error('Error getting active Parhaiyan:', error);
    return next(error);
  }
};
