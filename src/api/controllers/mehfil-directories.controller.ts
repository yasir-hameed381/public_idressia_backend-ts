import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as mehfilDirectoryService from '../services/mehfilDirectoryService';

export const getMehfilDirections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const page = req.query.page as string | undefined;
    const size = req.query.size as string | undefined;
    const zoneId = req.query.zoneId as string | undefined;
    const search = req.query.search as string | undefined;
    const result = await mehfilDirectoryService.getMehfilDirections({
      page,
      size,
      zoneId,
      search,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching mehfil-directories:', error);
    return next(error);
  }
};

export const createMehfilDirection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      zone_id,
      is_published,
      mehfil_number,
      name_en,
      name_ur,
      address_en,
      address_ur,
      city_en,
      city_ur,
      country_en,
      country_ur,
      google_location,
      mediacell_co,
      co_phone_number,
      zimdar_bhai,
      zimdar_bhai_phone_number,
      zimdar_bhai_phone_number_2,
      zimdar_bhai_phone_number_3,
      sarkari_rent,
      mehfil_open,
      ipad_serial_number,
      description,
    } = req.body;
    const required = [
      'zone_id',
      'mehfil_number',
      'name_en',
      'name_ur',
      'address_en',
      'address_ur',
      'city_en',
      'city_ur',
      'country_en',
      'country_ur',
    ];
    const missing = required.filter((f: string) => req.body[f] == null || req.body[f] === '');
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${required.join(', ')} are required.`,
      });
    }
    const result = await mehfilDirectoryService.createMehfilDirection({
      zone_id,
      is_published,
      mehfil_number,
      name_en,
      name_ur,
      address_en,
      address_ur,
      city_en,
      city_ur,
      country_en,
      country_ur,
      google_location,
      mediacell_co,
      co_phone_number,
      zimdar_bhai,
      zimdar_bhai_phone_number,
      zimdar_bhai_phone_number_2,
      zimdar_bhai_phone_number_3,
      sarkari_rent,
      mehfil_open,
      ipad_serial_number,
      description,
    });
    return res.status(201).json({
      success: true,
      message: 'Mehfil directory created successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error creating mehfil directory:', error as Error);
    return next(error);
  }
};

export const updateMehfilDirection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      zone_id,
      is_published,
      mehfil_number,
      name_en,
      name_ur,
      address_en,
      address_ur,
      city_en,
      city_ur,
      country_en,
      country_ur,
      google_location,
      mediacell_co,
      co_phone_number,
      zimdar_bhai,
      zimdar_bhai_phone_number,
      zimdar_bhai_phone_number_2,
      zimdar_bhai_phone_number_3,
      sarkari_rent,
      mehfil_open,
      ipad_serial_number,
      description,
    } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Mehfil Directory ID is required.' });
    }
    const required = [
      'zone_id',
      'mehfil_number',
      'name_en',
      'name_ur',
      'address_en',
      'address_ur',
      'city_en',
      'city_ur',
      'country_en',
      'country_ur',
    ];
    const missing = required.filter((f: string) => req.body[f] == null || req.body[f] === '');
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${required.join(', ')} are required.`,
      });
    }
    const result = await mehfilDirectoryService.updateMehfilDirection(id, {
      zone_id,
      is_published,
      mehfil_number,
      name_en,
      name_ur,
      address_en,
      address_ur,
      city_en,
      city_ur,
      country_en,
      country_ur,
      google_location,
      mediacell_co,
      co_phone_number,
      zimdar_bhai,
      zimdar_bhai_phone_number,
      zimdar_bhai_phone_number_2,
      zimdar_bhai_phone_number_3,
      sarkari_rent,
      mehfil_open,
      ipad_serial_number,
      description,
    });
    if (!result || !(result as { success?: boolean }).success) {
      return res.status(404).json({
        success: false,
        message: 'Mehfil Directory not found or update failed.',
      });
    }
    return res.status(200).json({ success: true, message: 'Mehfil Directory updated successfully.' });
  } catch (error) {
    logger.error('Error updating Mehfil Directory:', error as Error);
    return next(error);
  }
};

export const deleteMehfilDirection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await mehfilDirectoryService.deleteMehfilDirection(id);
    return res.json(result);
  } catch (error) {
    logger.error('Error deleting Mehfil Directory:', error);
    return next(error);
  }
};

export const getDirectionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await mehfilDirectoryService.getDirectionById(id);
    return res.json(result);
  } catch (error) {
    logger.error('Error get Mehfil Directory By id:', error);
    return next(error);
  }
};
