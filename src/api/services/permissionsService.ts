import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import permissionModel from '../models/permission';

const permissionsModelInstance = permissionModel(sequelize);

export const getPermissions = async () => {
  try {
    const permissions = await permissionsModelInstance.findAll({
      attributes: ['id', 'name', 'guard_name', 'created_at', 'updated_at'],
    });
    return permissions;
  } catch (error) {
    logger.error('Error fetching permissions:', error as Error);
    throw error;
  }
};
