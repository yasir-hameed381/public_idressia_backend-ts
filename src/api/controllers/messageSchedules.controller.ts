import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as messageSchedulesService from '../services/messageSchedulesService';

export const createMessageSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const newSchedule = await messageSchedulesService.createMessageSchedule(payload);
    return res.status(201).json({
      success: true,
      message: 'Message schedule created successfully',
      data: newSchedule,
    });
  } catch (error) {
    logger.error('Error creating message schedule:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'Message not found') {
      return res.status(404).json({ success: false, message });
    }
    return next(error);
  }
};

export const getMessageSchedules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const { page, size, message_id } = req.query;
    const result = await messageSchedulesService.getMessageSchedules({
      page: page as string | undefined,
      size: size as string | undefined,
      message_id: message_id as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching message schedules:', error);
    return next(error);
  }
};

export const getMessageScheduleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schedule = await messageSchedulesService.getMessageScheduleById(id);
    return res.json({
      success: true,
      message: 'Message schedule fetched successfully',
      data: schedule,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error fetching message schedule by id:', message);
    if (message === 'Message schedule not found') {
      return res.status(404).json({ success: false, message });
    }
    return next(error);
  }
};

export const updateMessageSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updatedSchedule = await messageSchedulesService.updateMessageSchedule(id, payload);
    return res.json({
      success: true,
      message: 'Message schedule updated successfully',
      data: updatedSchedule,
    });
  } catch (error) {
    logger.error('Error updating message schedule:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'Message schedule not found') {
      return res.status(404).json({ success: false, message });
    }
    return next(error);
  }
};

export const deleteMessageSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await messageSchedulesService.deleteMessageSchedule(id);
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Error deleting message schedule:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'Message schedule not found') {
      return res.status(404).json({ success: false, message });
    }
    return next(error);
  }
};
