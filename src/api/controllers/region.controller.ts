import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as regionService from '../services/regionsService';

export const getRegions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const page = req.query.page as string | undefined;
    const size = req.query.size as string | undefined;
    const search = req.query.search as string | undefined;
    const sortField = req.query.sortField as string | undefined;
    const sortDirection = req.query.sortDirection as string | undefined;
    const result = await regionService.getRegions({
      page,
      size,
      search,
      sortField,
      sortDirection,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching Regions:', error);
    return next(error);
  }
};

export const createRegion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, co, primaryPhoneNumber, secondaryPhoneNumber } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const result = await regionService.createRegion({
      name,
      description,
      co,
      primaryPhoneNumber,
      secondaryPhoneNumber,
    });
    return res.status(201).json({ success: true, message: 'Region created successfully', data: result });
  } catch (error) {
    logger.error('Error creating region:', error as Error);
    return next(error);
  }
};

export const updateRegion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, co, primaryPhoneNumber, secondaryPhoneNumber } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Region ID is required.' });
    }
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const result = await regionService.updateRegion({
      id,
      name,
      description,
      co,
      primaryPhoneNumber,
      secondaryPhoneNumber,
    });
    if (!result || !(result as { success?: boolean }).success) {
      return res.status(404).json({ success: false, message: 'Region not found or update failed.' });
    }
    return res.status(200).json({ success: true, message: 'Region updated successfully.' });
  } catch (error) {
    logger.error('Error updating Region:', error as Error);
    return next(error);
  }
};

export const deleteRegion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await regionService.deleteRegion(id);
    return res.json(result);
  } catch (error) {
    logger.error('Error deleting Region:', error);
    return next(error);
  }
};

export const getRegionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await regionService.getRegionById(id);
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching Region:', error);
    return next(error);
  }
};
