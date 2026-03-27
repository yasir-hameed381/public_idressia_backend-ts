import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as newEhadFollowUpService from '../services/newEhadFollowUpService';

export const getFollowUpsByNewEhad = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { newEhadId } = req.params;
    if (!newEhadId) {
      return res.status(400).json({
        success: false,
        message: 'New Ehad ID is required',
      });
    }
    const followUps = await newEhadFollowUpService.getFollowUpsByNewEhadId(newEhadId);
    return res.json({ success: true, data: followUps });
  } catch (error) {
    logger.error('Error fetching follow-ups:', error);
    return next(error);
  }
};

export const getAllFollowUps = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, size, search } = req.query;
    const result = await newEhadFollowUpService.getAllFollowUps({
      page: page as string | undefined,
      size: size as string | undefined,
      search: search as string | undefined,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching all follow-ups:', error);
    return next(error);
  }
};

export const getFollowUpById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const followUp = await newEhadFollowUpService.getFollowUpById(id);
    return res.json({ success: true, data: followUp });
  } catch (error) {
    logger.error('Error fetching follow-up:', error);
    return next(error);
  }
};

export const createFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      new_ehad_id,
      follow_up_date,
      contact_method,
      status,
      notes,
      next_follow_up_date,
      created_by,
    } = req.body;
    if (!new_ehad_id || !follow_up_date || !contact_method || !status) {
      return res.status(400).json({
        success: false,
        message: 'new_ehad_id, follow_up_date, contact_method, and status are required',
      });
    }
    const followUp = await newEhadFollowUpService.createFollowUp({
      new_ehad_id,
      follow_up_date,
      contact_method,
      status,
      notes,
      next_follow_up_date,
      created_by,
    });
    return res.status(201).json({
      success: true,
      message: 'Follow-up created successfully',
      data: followUp,
    });
  } catch (error) {
    logger.error('Error creating follow-up:', error);
    return next(error);
  }
};

export const updateFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      follow_up_date,
      contact_method,
      status,
      notes,
      next_follow_up_date,
      updated_by,
    } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Follow-up ID is required',
      });
    }
    const followUp = await newEhadFollowUpService.updateFollowUp(id, {
      follow_up_date,
      contact_method,
      status,
      notes,
      next_follow_up_date,
      updated_by,
    });
    return res.json({
      success: true,
      message: 'Follow-up updated successfully',
      data: followUp,
    });
  } catch (error) {
    logger.error('Error updating follow-up:', error);
    return next(error);
  }
};

export const deleteFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Follow-up ID is required',
      });
    }
    const result = await newEhadFollowUpService.deleteFollowUp(id);
    return res.json(result);
  } catch (error) {
    logger.error('Error deleting follow-up:', error);
    return next(error);
  }
};
