import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger';
import * as rolesService from '../services/rolesService';

export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const result = await rolesService.getRoles({
      page: req.query.page as string | undefined,
      size: req.query.size as string | undefined,
      search: req.query.search as string | undefined,
      requestUrl,
    });
    return res.json(result);
  } catch (error) {
    logger.error('Error fetching roles:', error);
    return next(error);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, guard_name, permissions } = req.body;
    const result = await rolesService.createRole({ name, guard_name, permissions });
    return res.status(201).json({ success: true, message: 'Role created successfully', data: result });
  } catch (error) {
    logger.error('Error creating Role:', error as Error);
    return next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, guard_name, permissions } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Role ID is required.' });
    }
    const result = await rolesService.updateRole({ id, name, guard_name, permissions });
    if (!result || (result as { success?: boolean }).success === false) {
      return res.status(404).json({ success: false, message: 'Role not found or update failed.' });
    }
    return res.status(200).json({ success: true, message: 'Role updated successfully', data: result });
  } catch (error) {
    logger.error('Error updating Role:', error as Error);
    return next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Role ID is required.' });
    }
    const result = await rolesService.deleteRole(id);
    if (!result || (result as { success?: boolean }).success === false) {
      return res.status(404).json({ success: false, message: 'Role not found or delete failed.' });
    }
    return res.status(200).json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    logger.error('Error deleting Role:', error as Error);
    return next(error);
  }
};

export const getRoleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Role ID is required.' });
    }
    const result = await rolesService.getRoleById(id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('Error fetching role by ID:', error as Error);
    return next(error);
  }
};
