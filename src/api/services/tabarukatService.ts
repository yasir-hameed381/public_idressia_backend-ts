import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import tabarukatModel from '../models/tabarukat';
import { paginate, constructPagination } from './utilityServices';
import { SearchFields } from '../Enums/searchEnums';

const modelInstance = tabarukatModel(sequelize);

export const getTabarukat = async ({
  page = 1,
  size = 50,
  search = '',
  zone_id,
  mehfil_directory_id,
  requestUrl = '',
}: {
  page?: number | string;
  size?: number | string;
  search?: string;
  zone_id?: string | number;
  mehfil_directory_id?: string | number;
  requestUrl?: string;
}) => {
  try {
    const searchFields = [SearchFields.NAME, SearchFields.DESCRIPTION];
    const { offset, limit, currentPage } = paginate({ page, size });
    const where: Record<string, unknown> = {};
    if (search && String(search).trim() && searchFields.length > 0) {
      (where as Record<symbol, unknown>)[Op.or as unknown as symbol] = searchFields.map((field) => ({
        [field]: { [Op.like]: `%${String(search).trim()}%` },
      }));
    }
    if (zone_id != null && String(zone_id).trim() !== '') {
      const n = parseInt(String(zone_id), 10);
      if (!isNaN(n)) where.zone_id = n;
    }
    if (mehfil_directory_id != null && String(mehfil_directory_id).trim() !== '') {
      const n = parseInt(String(mehfil_directory_id), 10);
      if (!isNaN(n)) where.mehfil_directory_id = n;
    }
    const { count, rows: data } = await modelInstance.findAndCountAll({ where, offset, limit });
    const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl });
    return { data, links, meta };
  } catch (error) {
    logger.error('Error fetching tabarukat:', error as Error);
    throw error;
  }
};

export const getTabarukatById = async (id: string | number) => {
  try {
    const row = await modelInstance.findByPk(String(id));
    if (!row) return { success: false, message: 'Tabarukat not found' };
    return { success: true, data: row };
  } catch (error) {
    logger.error('Error getTabarukatById:', error as Error);
    throw error;
  }
};
