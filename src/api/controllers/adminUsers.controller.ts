import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as adminUsersService from '../services/adminUsersService';

export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const { page, size, search, sortField, sortDirection, zone_id, mehfil_directory_id, activeTab } = req.query;
    const result = await adminUsersService.getuserAdmins({
      page: page as string | number | undefined,
      size: size as string | number | undefined,
      search: search as string | undefined,
      sortField: sortField as string | undefined,
      sortDirection: sortDirection as string | undefined,
      requestUrl,
      zone_id: zone_id as string | null | undefined,
      mehfil_directory_id: mehfil_directory_id as string | null | undefined,
      activeTab: activeTab as string | null | undefined,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching admin users:', error);
    return next(error);
  }
};

export const getAdminUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'karkun id not found ' });
    }
    const result = await adminUsersService.getAdminUserById(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching admin user:', error);
    return next(error);
  }
};

export const createAdminUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as Record<string, unknown>;
    const result = await adminUsersService.createAdminUser(body as Parameters<typeof adminUsersService.createAdminUser>[0]);
    return res.status(201).json({
      success: true,
      message: 'admin user created successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error creating admin user:', error);
    return next(error);
  }
};

export const updateAdminUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'admin user id not found' });
    }
    const result = await adminUsersService.updateAdminUser({ ...req.body, id });
    if (!result?.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error updated admin user:', error);
    return next(error);
  }
};

export const deleteAdminUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({ success: false, message: 'admin user id is required' });
    }
    const result = await adminUsersService.deleteAdminUser(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Error deleting admin user', error);
    return next(error);
  }
};
