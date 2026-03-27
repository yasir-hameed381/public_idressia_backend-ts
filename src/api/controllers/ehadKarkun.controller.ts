import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as ehadKarkunService from '../services/ehadKarkunService';

export const getEhadKarkuns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await ehadKarkunService.getEhadKarkuns({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      search: req.query.search as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching ehad karkuns:', error);
    return next(error);
  }
};
