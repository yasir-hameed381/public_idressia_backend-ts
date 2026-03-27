import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const UAParser = require('ua-parser-js');
import logger from '../../config/logger';
import * as parhaiyanRecitationsService from '../services/parhaiyanRecitationsService';

export const getParhaiyanRecitations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const { page, size, search, parhaiyan_id } = req.query;
    const result = await parhaiyanRecitationsService.getParhaiyanRecitations({
      page: page as string | undefined,
      size: size as string | undefined,
      search: search as string | undefined,
      parhaiyan_id: parhaiyan_id != null ? parseInt(String(parhaiyan_id), 10) : null,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching Parhaiyan Recitations:', error);
    return next(error);
  }
};

export const addParhaiyanRecitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ip_address =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '';
    const user_agent = req.headers['user-agent'] || '';
    const parser = new UAParser(user_agent);
    const uaResult = parser.getResult();
    const browser = uaResult.browser?.name || 'Unknown Browser';
    const device = uaResult.device?.type || 'Desktop';
    const operating_system = uaResult.os?.name || 'Unknown OS';
    const referrer = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    const userRequestedFrom = {
      ip_address,
      user_agent,
      browser,
      device,
      operating_system,
      referrer,
    };

    const {
      parhaiyan_id,
      darood_ibrahimi,
      yaseen_shareef,
      qul_shareef,
      quran_pak,
      name,
      father_name,
      city,
      mobile_number,
    } = req.body;

    if (!parhaiyan_id || !name || !father_name || !city || !mobile_number) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required fields: parhaiyan_id , name , father_name , city , mobile_number are required.',
      });
    }

    const result = await parhaiyanRecitationsService.createParhaiyanRecitations({
      parhaiyan_id: Number(parhaiyan_id),
      darood_ibrahimi,
      yaseen_shareef,
      qul_shareef,
      quran_pak,
      name,
      father_name,
      city,
      mobile_number,
      ...userRequestedFrom,
    });

    return res.status(201).json({
      success: true,
      message: 'parhaiyan Added successfully',
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error Add parhaiyan: ${message}`);
    return next(error);
  }
};

export const deleteParhaiyanRecitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await parhaiyanRecitationsService.deleteParhaiyanRecitation(id);
    return res.json({
      success: true,
      message: 'Recitation deleted successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error deleting recitation: ${message}`);
    return next(error);
  }
};
