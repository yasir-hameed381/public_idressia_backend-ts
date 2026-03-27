import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as karkunJoinRequestService from '../services/karkunJoinRequestService';

export const createKarkunJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      avatar,
      first_name,
      last_name,
      email,
      phone_no,
      user_type,
      birth_year,
      ehad_year,
      zone_id,
      city,
      country,
      is_approved,
    } = req.body;

    const result = await karkunJoinRequestService.createKarkunJoinRequest({
      avatar,
      first_name,
      last_name,
      email,
      phone_no,
      user_type,
      birth_year,
      ehad_year,
      zone_id,
      city,
      country,
      is_approved,
    });

    return res.status(201).json({
      success: true,
      message: 'Karkun join request created successfully.',
      data: result.data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error creating karkun join request: ${message}`);
    return next(error);
  }
};

export const getKarkunJoinRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const { page, size, search } = req.query;

    const result = await karkunJoinRequestService.getKarkunJoinRequests({
      page: page as string | undefined,
      size: size as string | undefined,
      search: search as string | undefined,
      requestUrl: requestUrl as string | undefined,
    });

    return res.json(result);
  } catch (error) {
    logger.error('Error fetching karkun join requests:', error);
    return next(error);
  }
};

export const getKarkunJoinRequestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Karkun join request ID is required.',
      });
    }

    const result = await karkunJoinRequestService.getKarkunJoinRequestById(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching karkun join request: ${message}`);
    return next(error);
  }
};

export const updateKarkunJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Karkun join request ID is required.',
      });
    }

    const {
      avatar,
      first_name,
      last_name,
      email,
      phone_no,
      user_type,
      birth_year,
      ehad_year,
      zone_id,
      city,
      country,
      is_approved,
    } = req.body;

    const result = await karkunJoinRequestService.updateKarkunJoinRequest(id, {
      avatar,
      first_name,
      last_name,
      email,
      phone_no,
      user_type,
      birth_year,
      ehad_year,
      zone_id,
      city,
      country,
      is_approved,
    });

    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error updating karkun join request: ${message}`);
    return next(error);
  }
};

export const deleteKarkunJoinRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Karkun join request ID is required.',
      });
    }

    const result = await karkunJoinRequestService.deleteKarkunJoinRequest(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error deleting karkun join request: ${message}`);
    return next(error);
  }
};
