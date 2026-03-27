import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as naatService from '../services/naatService';

export const getNaatShareefs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await naatService.getNaatShareefs({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      search: req.query.search as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching naat shareefs:', error);
    return next(error);
  }
};
