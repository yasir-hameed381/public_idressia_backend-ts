import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as namazService from '../services/namazService';

export const getNamazTimings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await namazService.getNamazTimings({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching namaz timings:', error);
    return next(error);
  }
};
