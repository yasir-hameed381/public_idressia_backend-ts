import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as khatService from '../services/khatService';

export const getKhats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await khatService.getKhats({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      search: req.query.search as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching khats:', error);
    return next(error);
  }
};
