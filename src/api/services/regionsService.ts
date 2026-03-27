import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import regionModel from '../models/region';
import zoneModel from '../models/zone';
import { paginate, constructPagination } from './utilityServices';
import { SearchFields } from '../Enums/searchEnums';

const regionsModelInstance = regionModel(sequelize);
const zonesModelInstance = zoneModel(sequelize);

export const getRegions = async ({
  page = 1,
  size = 50,
  search = '',
  sortField = 'id',
  sortDirection = 'ASC',
  requestUrl = '',
}: {
  page?: number | string;
  size?: number | string;
  search?: string;
  sortField?: string;
  sortDirection?: string;
  requestUrl?: string;
}) => {
  try {
    const searchFields = [SearchFields.NAME, SearchFields.CO];
    const { offset, limit, currentPage } = paginate({ page, size });
    const where: Record<string, unknown> = {};
    if (search && searchFields.length > 0) {
      (where as Record<symbol, unknown>)[Op.or as unknown as symbol] = searchFields.map((field) => ({
        [field]: { [Op.like]: `%${search}%` },
      }));
    }
    const sortableFields = ['id', 'name', 'co', 'created_at', 'updated_at'];
    const normalizedSortField = sortableFields.includes(sortField) ? sortField : 'id';
    const normalizedSortDirection =
      typeof sortDirection === 'string' && sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const { count, rows: data } = await regionsModelInstance.findAndCountAll({
      where,
      offset,
      limit,
      order: [[normalizedSortField, normalizedSortDirection]],
    });
    const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl });
    return { data, links, meta };
  } catch (error) {
    logger.error('Error fetching regions:', error as Error);
    throw error;
  }
};

export const createRegion = async ({
  name,
  description,
  co,
  primaryPhoneNumber,
  secondaryPhoneNumber,
}: {
  name: string;
  description?: string;
  co?: string;
  primaryPhoneNumber?: string;
  secondaryPhoneNumber?: string;
}) => {
  try {
    return await regionsModelInstance.create({
      name,
      description,
      co,
      primary_phone_number: primaryPhoneNumber,
      secondary_phone_number: secondaryPhoneNumber,
      created_at: new Date(),
    } as Record<string, unknown>);
  } catch (error) {
    logger.error('Error creating region:', error as Error);
    throw new Error(`Failed to create region: ${(error as Error).message}`);
  }
};

export const updateRegion = async ({
  id,
  name,
  description,
  co,
  primaryPhoneNumber,
  secondaryPhoneNumber,
}: {
  id: string | number;
  name: string;
  description?: string;
  co?: string;
  primaryPhoneNumber?: string;
  secondaryPhoneNumber?: string;
}) => {
  try {
    const regionCheck = await regionsModelInstance.findByPk(String(id));
    if (!regionCheck) {
      return { success: false, message: 'Region not found' };
    }
    const updatePayload = {
      name,
      description,
      co,
      primary_phone_number: primaryPhoneNumber,
      secondary_phone_number: secondaryPhoneNumber,
      updated_at: new Date(),
    };
    await regionsModelInstance.update(updatePayload as Record<string, unknown>, { where: { id } });
    return { success: true, message: 'Region updated successfully' };
  } catch (error) {
    logger.error('Error updating region:', error as Error);
    throw error;
  }
};

export const deleteRegion = async (id: string | number) => {
  try {
    if (!id || (typeof id === 'string' && isNaN(Number(id)))) {
      return { success: false, message: 'Invalid region ID provided' };
    }
    const region = await regionsModelInstance.findByPk(String(id));
    if (!region) {
      return { success: false, message: 'Region not found.' };
    }
    const zonesCount = await zonesModelInstance.count({ where: { region_id: id } });
    if (zonesCount > 0) {
      return { success: false, message: 'Cannot delete region with associated zones.' };
    }
    await region.destroy();
    return { success: true, message: 'Region deleted successfully.' };
  } catch (error) {
    logger.error('Error deleting region:', error as Error);
    throw error;
  }
};

export const getRegionById = async (id: string | number) => {
  try {
    if (!id || (typeof id === 'string' && isNaN(Number(id)))) {
      return { success: false, message: 'Invalid region ID provided' };
    }
    const region = await regionsModelInstance.findByPk(String(id));
    if (!region) {
      return { success: false, message: 'Region not found.' };
    }
    return { success: true, data: region };
  } catch (error) {
    logger.error('Error fetching region:', error as Error);
    throw error;
  }
};
