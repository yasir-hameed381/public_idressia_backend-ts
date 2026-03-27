import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as dutyRosterService from '../services/dutyRosterService';
import * as dutyRosterAssignmentService from '../services/dutyRosterAssignmentService';

export const getAllDutyRosters = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { zone_id, mehfil_directory_id, user_type, search } = req.query;
    const result = await dutyRosterService.getAllDutyRosters({
      zoneId: zone_id as string | undefined,
      mehfilDirectoryId: mehfil_directory_id as string | undefined,
      userTypeFilter: (user_type as string) || 'karkun',
      search: (search as string) || '',
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching duty rosters:', error);
    return next(error);
  }
};

export const getAvailableKarkuns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { zoneId, mehfilDirectoryId, userTypeFilter, search } = req.query;
    if (!zoneId) {
      return res.status(400).json({
        success: false,
        message: 'zoneId is required',
      });
    }
    const karkuns = await dutyRosterService.getAvailableKarkuns({
      zoneId: zoneId as string,
      mehfilDirectoryId: mehfilDirectoryId as string | undefined,
      userTypeFilter: (userTypeFilter as string) || 'karkun',
      search: (search as string) || '',
    });
    return res.json({
      success: true,
      data: karkuns,
    });
  } catch (error) {
    logger.error('Error fetching available karkuns:', error);
    return next(error);
  }
};

export const getDutyRosterByKarkun = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ehadKarkunId } = req.params;
    if (!ehadKarkunId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }
    const dutyRosters = await dutyRosterService.getDutyRosterByKarkun(ehadKarkunId);
    return res.json({
      success: true,
      data: dutyRosters,
    });
  } catch (error) {
    logger.error('Error fetching duty roster by user:', error);
    return next(error);
  }
};

export const getDutyRosterById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const dutyRoster = await dutyRosterService.getDutyRosterById(id);
    return res.json({
      success: true,
      data: dutyRoster,
    });
  } catch (error) {
    logger.error('Error fetching duty roster:', error);
    return next(error);
  }
};

export const createDutyRoster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, zone_id, mehfil_directory_id, created_by } = req.body;
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required',
      });
    }
    const duties: Record<string, number> = {};
    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    days.forEach((day) => {
      const dutyTypeId = req.body[`duty_type_id_${day}`];
      if (dutyTypeId) {
        duties[day] = parseInt(String(dutyTypeId), 10);
      }
    });

    const dutyRoster = await dutyRosterService.createDutyRoster({
      user_id,
      zone_id,
      mehfil_directory_id,
      created_by,
      duties,
    });

    return res.status(201).json({
      success: true,
      message: 'Karkun added to roster successfully',
      data: dutyRoster,
    });
  } catch (error) {
    logger.error('Error creating duty roster:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('already in the roster') || message.includes('select a mehfil')) {
      return res.status(400).json({
        success: false,
        message,
      });
    }
    return next(error);
  }
};

export const updateDutyRoster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { user_id, zone_id, mehfil_directory_id, updated_by } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Duty roster ID is required',
      });
    }
    const dutyRoster = await dutyRosterService.updateDutyRoster(id, {
      user_id,
      zone_id,
      mehfil_directory_id,
      updated_by,
    });
    return res.json({
      success: true,
      message: 'Duty roster updated successfully',
      data: dutyRoster,
    });
  } catch (error) {
    logger.error('Error updating duty roster:', error);
    return next(error);
  }
};

export const addDuty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rosterId, day, dutyTypeId } = req.body;
    if (!rosterId || !day || !dutyTypeId) {
      return res.status(400).json({
        success: false,
        message: 'rosterId, day, and dutyTypeId are required',
      });
    }
    const assignment = await dutyRosterAssignmentService.createAssignment({
      duty_roster_id: rosterId,
      duty_type_id: dutyTypeId,
      day,
    });
    return res.json({
      success: true,
      message: 'Duty added successfully',
      data: assignment,
    });
  } catch (error) {
    logger.error('Error adding duty:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('already assigned') ||
      message.includes('coordinator')
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }
    return next(error);
  }
};

export const removeDuty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required',
      });
    }
    const result = await dutyRosterAssignmentService.deleteAssignment(id);
    return res.json({
      success: true,
      message: 'Duty removed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error removing duty:', error);
    return next(error);
  }
};

export const deleteDutyRoster = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Duty roster ID is required',
      });
    }
    const result = await dutyRosterService.deleteDutyRoster(id);
    return res.json(result);
  } catch (error) {
    logger.error('Error deleting duty roster:', error);
    return next(error);
  }
};
