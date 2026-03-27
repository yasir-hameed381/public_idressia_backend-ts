import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as mehfilReportsService from '../services/mehfilReportsService';

export const getMehfilReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await mehfilReportsService.getMehfilReports({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching mehfil reports:', error);
    return next(error);
  }
};
