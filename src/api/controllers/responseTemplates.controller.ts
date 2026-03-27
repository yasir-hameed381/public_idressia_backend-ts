import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as responseTemplatesService from '../services/responseTemplatesService';

export const getResponseTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await responseTemplatesService.getResponseTemplates({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching response templates:', error);
    return next(error);
  }
};
