import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as searchService from '../services/searchService';

export const search = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, type } = req.query;
    const result = await searchService.search({
      query: (query as string) || '',
      type: (type as string) || '',
    });
    return res.json(result);
  } catch (error) {
    logger.error(error);
    return next(error);
  }
};
