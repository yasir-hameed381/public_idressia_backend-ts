import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as wazaifsService from '../services/wazaifsService';

export async function getWazaifs(req: Request, res: Response, next: NextFunction) {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await wazaifsService.getWazaifs({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      search: req.query.search as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching wazaifs:', error);
    return next(error);
  }
}
