import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as zoneService from '../services/zonesService';

export const getZones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const page = req.query.page as string | undefined;
    const size = req.query.size as string | undefined;
    const search = req.query.search as string | undefined;
    const result = await zoneService.getZones({ page, size, search, requestUrl });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching Zones:', error);
    return next(error);
  }
};

export const createZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      titleEn,
      titleUr,
      description,
      countryEn,
      countryUr,
      cityEn,
      cityUr,
      co,
      primaryPhoneNumber,
      secondaryPhoneNumber,
      regionId,
    } = req.body;
    const requiredFields = ['titleEn', 'titleUr', 'countryEn', 'countryUr', 'cityEn', 'cityUr'];
    const missingFields = requiredFields.filter((f: string) => req.body[f] == null || req.body[f] === '');
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }
    const result = await zoneService.createZone({
      titleEn,
      titleUr,
      description,
      countryEn,
      countryUr,
      cityEn,
      cityUr,
      co,
      primaryPhoneNumber,
      secondaryPhoneNumber,
      regionId,
    });
    return res.status(201).json({ success: true, message: 'Zone created successfully', data: result });
  } catch (error) {
    logger.error('Error creating zone:', error as Error);
    return next(error);
  }
};

export const updateZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      titleEn,
      titleUr,
      description,
      countryEn,
      countryUr,
      cityEn,
      cityUr,
      co,
      primaryPhoneNumber,
      secondaryPhoneNumber,
      regionId,
    } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Zone ID is required.' });
    }
    const requiredFields = ['titleEn', 'titleUr', 'countryEn', 'countryUr', 'cityEn', 'cityUr'];
    const missingFields = requiredFields.filter((f: string) => req.body[f] == null || req.body[f] === '');
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }
    const result = await zoneService.updateZone({
      id,
      titleEn,
      titleUr,
      description,
      countryEn,
      countryUr,
      cityEn,
      cityUr,
      co,
      primaryPhoneNumber,
      secondaryPhoneNumber,
      regionId,
    });
    if (!result || !(result as { success?: boolean }).success) {
      return res.status(404).json({ success: false, message: 'Zone not found or update failed.' });
    }
    return res.status(200).json({ success: true, message: 'Zone updated successfully.' });
  } catch (error) {
    logger.error('Error updating Zone:', error as Error);
    return next(error);
  }
};

export const deleteZone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await zoneService.deleteZone(id);
    return res.json(result);
  } catch (error) {
    logger.error('Error deleting Zone:', error);
    return next(error);
  }
};

export const getZoneById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await zoneService.getZoneById(id);
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching Zone:', error);
    return next(error);
  }
};
