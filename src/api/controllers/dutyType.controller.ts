import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as dutyTypeService from '../services/dutyTypeService';

export const getAllDutyTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, size, search, zone_id } = req.query;
    const result = await dutyTypeService.getAllDutyTypes({
      page: page as string | undefined,
      size: size as string | undefined,
      search: search as string | undefined,
      zone_id: zone_id as string | undefined,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching duty types:', error);
    return next(error);
  }
};

export const getActiveDutyTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { zone_id } = req.query;
    const dutyTypes = await dutyTypeService.getActiveDutyTypes(zone_id as string | undefined);
    return res.json({
      success: true,
      data: dutyTypes,
    });
  } catch (error) {
    logger.error('Error fetching active duty types:', error);
    return next(error);
  }
};

export const getDutyTypeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const dutyType = await dutyTypeService.getDutyTypeById(id);
    return res.json({
      success: true,
      data: dutyType,
    });
  } catch (error) {
    logger.error('Error fetching duty type:', error);
    return next(error);
  }
};

export const createDutyType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { zone_id, name, description, is_editable = 1, created_by } = req.body;
    if (!zone_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'zone_id and name are required',
      });
    }
    const dutyType = await dutyTypeService.createDutyType({
      zone_id,
      name,
      description,
      is_editable,
      created_by,
    });
    return res.status(201).json({
      success: true,
      message: 'Duty type created successfully',
      data: dutyType,
    });
  } catch (error) {
    logger.error('Error creating duty type:', error);
    return next(error);
  }
};

export const updateDutyType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { zone_id, name, description, is_editable, updated_by } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Duty type ID is required',
      });
    }
    const dutyType = await dutyTypeService.updateDutyType(id, {
      zone_id,
      name,
      description,
      is_editable,
      updated_by,
    });
    return res.json({
      success: true,
      message: 'Duty type updated successfully',
      data: dutyType,
    });
  } catch (error) {
    logger.error('Error updating duty type:', error);
    return next(error);
  }
};

export const deleteDutyType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Duty type ID is required',
      });
    }
    const result = await dutyTypeService.deleteDutyType(id);
    return res.json(result);
  } catch (error) {
    logger.error('Error deleting duty type:', error);
    return next(error);
  }
};
