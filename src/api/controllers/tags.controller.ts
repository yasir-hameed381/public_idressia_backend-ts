import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as tagsService from '../services/tagsService';

export const getTags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await tagsService.getTags({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      search: req.query.search as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching tags:', error);
    return next(error);
  }
};

export const getTagsById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tag = await tagsService.getTagsById(req.params.id);
    return res.json(tag);
  } catch (error) {
    logger.error('Error getTagsById:', error);
    return next(error);
  }
};
