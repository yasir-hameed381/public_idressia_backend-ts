import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as karkunService from '../services/karkunService';

export const createKarkun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      zone,
      zone_id,
      name,
      email,
      password,
      city,
      country,
      is_zone_admin,
      is_mehfile_admin,
      is_mehfil_admin,
      user_type,
      father_name,
      mobile_no,
      phone_number,
      cnic_no,
      id_card_number,
      address,
      birth_year,
      ehad_year,
      duty_days,
      duty_type,
    } = req.body;

    const result = await karkunService.createKarkun({
      zone_id: zone_id || zone,
      name,
      email,
      password,
      city,
      country,
      is_zone_admin,
      is_mehfil_admin: is_mehfil_admin ?? is_mehfile_admin,
      user_type: user_type || 'karkun',
      father_name,
      phone_number: phone_number || mobile_no,
      id_card_number: id_card_number || cnic_no,
      address,
      birth_year,
      ehad_year,
      duty_days,
      duty_type,
    });

    return res.status(201).json({
      success: true,
      message: 'karkun created successfully',
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error creating karkun: ${message}`);
    return next(error);
  }
};

export const getKarkun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.removeHeader('ETag');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Last-Modified', new Date().toUTCString());

    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
    const { page, size, search, zone_id, activeTab, sortBy, sortDirection } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const sizeNum = parseInt(String(size), 10) || 50;
    const zoneIdNum = zone_id != null ? parseInt(String(zone_id), 10) : null;

    const result = await karkunService.getKarkun({
      page: pageNum,
      size: sizeNum,
      search: (search as string) || '',
      zone_id: zoneIdNum,
      activeTab: (activeTab as string) || null,
      sortBy: (sortBy as string) || 'name',
      sortDirection: (sortDirection as string) || 'asc',
      requestUrl: baseUrl,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching karkuns:', error);
    return next(error);
  }
};

export const getKarkunById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.removeHeader('ETag');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Last-Modified', new Date().toUTCString());

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'karkun id not found' });
    }
    const result = await karkunService.getKarkunById(id);
    if (!result?.success) {
      return res.status(404).json(result || { success: false, message: 'karkun not found' });
    }
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching karkuns:', error);
    return next(error);
  }
};

export const updateKarkun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      zone,
      zone_id,
      name,
      email,
      password,
      city,
      country,
      is_zone_admin,
      is_mehfile_admin,
      is_mehfil_admin,
      user_type,
      father_name,
      mobile_no,
      phone_number,
      cnic_no,
      id_card_number,
      address,
      birth_year,
      ehad_year,
      duty_days,
      duty_type,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'karkun ID is required.',
      });
    }

    const result = await karkunService.updateKarkun(id, {
      zone_id: zone_id ?? zone,
      name,
      email,
      password,
      city,
      country,
      is_zone_admin,
      is_mehfil_admin: is_mehfil_admin ?? is_mehfile_admin,
      user_type,
      father_name,
      phone_number: phone_number ?? mobile_no,
      id_card_number: id_card_number ?? cnic_no,
      address,
      birth_year,
      ehad_year,
      duty_days,
      duty_type,
    });

    if (!result?.success) {
      return res.status(404).json({
        success: false,
        message: 'karkun not found or update failed.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'karkun updated successfully.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error updating karkun: ${message}`);
    return next(error);
  }
};

export const deleteKarkun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Karkun ID is required',
      });
    }
    const result = await karkunService.deleteKarkun(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error deleting karkun: ${message}`);
    return next(error);
  }
};
