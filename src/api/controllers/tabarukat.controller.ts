import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as tabarukatService from '../services/tabarukatService';

export const getTabarukat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const { page, size, search, zone_id, mehfil_directory_id } = req.query;
    const result = await tabarukatService.getTabarukat({
      page: page as string | undefined,
      size: size as string | undefined,
      search: search as string | undefined,
      zone_id: zone_id as string | number | undefined,
      mehfil_directory_id: mehfil_directory_id as string | number | undefined,
      requestUrl,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    logger.error('Error fetching Tabarukat:', error as Error);
    return next(error);
  }
};

export const getTabarukatById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await tabarukatService.getTabarukatById(id);
    if (!(result as { success?: boolean }).success) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error getTabarukatById:', error as Error);
    return next(error);
  }
};
