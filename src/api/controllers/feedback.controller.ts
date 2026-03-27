import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as feedbackService from '../services/feedbackService';

export const getFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await feedbackService.getFeedback({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching feedback:', error);
    return next(error);
  }
};
