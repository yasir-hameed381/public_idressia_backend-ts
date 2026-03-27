import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as messagesService from '../services/messagesService';

export async function getMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await messagesService.getMessages({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      search: req.query.search as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching messages:', error);
    return next(error);
  }
}
