import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as mehfilCoordinatorService from '../services/mehfilCoordinatorService';

export const getAllCoordinators = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, size, search, mehfilDirectoryId } = req.query;
    const result = await mehfilCoordinatorService.getAllCoordinators({
      page: page as string | undefined,
      size: size as string | undefined,
      search: search as string | undefined,
      mehfilDirectoryId: mehfilDirectoryId as string | undefined,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching coordinators:', error);
    return next(error);
  }
};

export const getActiveCoordinatorsByMehfil = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mehfilDirectoryId } = req.params;
    if (!mehfilDirectoryId) {
      return res.status(400).json({
        success: false,
        message: 'Mehfil Directory ID is required',
      });
    }
    const coordinators = await mehfilCoordinatorService.getActiveCoordinatorsByMehfil(mehfilDirectoryId);
    return res.json({ success: true, data: coordinators });
  } catch (error) {
    logger.error('Error fetching active coordinators:', error);
    return next(error);
  }
};

export const getCoordinatorById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const coordinator = await mehfilCoordinatorService.getCoordinatorById(id);
    return res.json({ success: true, data: coordinator });
  } catch (error) {
    logger.error('Error fetching coordinator:', error);
    return next(error);
  }
};

export const createCoordinator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    if (!body.mehfil_directory_id || !body.user_id || !body.coordinator_type) {
      return res.status(400).json({
        success: false,
        message: 'mehfil_directory_id, user_id, and coordinator_type are required',
      });
    }
    const coordinator = await mehfilCoordinatorService.createCoordinator(body);
    return res.status(201).json({
      success: true,
      message: 'Coordinator created successfully',
      data: coordinator,
    });
  } catch (error) {
    logger.error('Error creating coordinator:', error);
    return next(error);
  }
};

export const updateCoordinator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Coordinator ID is required',
      });
    }
    const coordinator = await mehfilCoordinatorService.updateCoordinator(id, req.body);
    return res.json({
      success: true,
      message: 'Coordinator updated successfully',
      data: coordinator,
    });
  } catch (error) {
    logger.error('Error updating coordinator:', error);
    return next(error);
  }
};

export const deleteCoordinator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Coordinator ID is required',
      });
    }
    const result = await mehfilCoordinatorService.deleteCoordinator(id);
    return res.json(result);
  } catch (error) {
    logger.error('Error deleting coordinator:', error);
    return next(error);
  }
};
