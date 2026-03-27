import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import mehfilDirectoryModel from '../models/mehfil-directories';
import { paginate, constructPagination } from './utilityServices';
import { SearchFields } from '../Enums/searchEnums';

const modelInstance = mehfilDirectoryModel(sequelize);

export const getMehfilDirections = async ({
  page = 1,
  size = 25,
  zoneId = '',
  search = '',
  requestUrl = '',
}: {
  page?: number | string;
  size?: number | string;
  zoneId?: string;
  search?: string;
  requestUrl?: string;
}) => {
  try {
    const searchFields = [
      SearchFields.ID,
      SearchFields.MEHFIL_NUMBER,
      SearchFields.COUNTRY_EN,
      SearchFields.COUNTRY_UR,
      SearchFields.CITY_EN,
      SearchFields.CITY_UR,
      SearchFields.NAME_EN,
      SearchFields.NAME_UR,
      SearchFields.ADDRESS_EN,
      SearchFields.ADDRESS_UR,
      SearchFields.MEDIACELL_CO,
      SearchFields.CO_PHONE_NUMBER,
      SearchFields.ZIMDAR_BHAI,
      SearchFields.ZIMDAR_BHAI_PHONE_NUMBER,
      SearchFields.ZIMDAR_BHAI_PHONE_NUMBER_2,
      SearchFields.ZIMDAR_BHAI_PHONE_NUMBER_3,
      SearchFields.SARKARI_RENT,
      SearchFields.IPAD_SERIAL_NUMBER,
    ];
    const { offset, limit, currentPage } = paginate({ page, size });
    const where: Record<string, unknown> = {};
    if (search && searchFields.length > 0) {
      (where as Record<symbol, unknown>)[Op.or as unknown as symbol] = searchFields.map((field) => ({
        [field]: { [Op.like]: `%${search}%` },
      }));
    }
    if (zoneId) {
      where.zone_id = zoneId;
    }
    const { count, rows: data } = await modelInstance.findAndCountAll({ where, offset, limit });
    const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl });
    return { data, links, meta };
  } catch (error) {
    logger.error('Error fetching mehfil-directories:', error as Error);
    throw error;
  }
};

type MehfilDirPayload = {
  zone_id: number;
  is_published?: number;
  mehfil_number: string;
  name_en: string;
  name_ur: string;
  address_en: string;
  address_ur: string;
  city_en: string;
  city_ur: string;
  country_en: string;
  country_ur: string;
  google_location?: string;
  mediacell_co?: string;
  co_phone_number?: string;
  zimdar_bhai?: string;
  zimdar_bhai_phone_number?: string;
  zimdar_bhai_phone_number_2?: string;
  zimdar_bhai_phone_number_3?: string;
  sarkari_rent?: string;
  mehfil_open?: string;
  ipad_serial_number?: string;
  description?: string;
};

export const createMehfilDirection = async (payload: MehfilDirPayload) => {
  try {
    const createPayload = { ...payload, created_at: new Date() };
    return await modelInstance.create(createPayload as Record<string, unknown>);
  } catch (error) {
    logger.error('Error creating mehfil-direction:', error as Error);
    throw new Error(`Failed to create mehfil-direction: ${(error as Error).message}`);
  }
};

export const updateMehfilDirection = async (id: string | number, payload: MehfilDirPayload) => {
  try {
    const existing = await modelInstance.findByPk(String(id));
    if (!existing) {
      return { success: false, message: 'Mehfil directory not found' };
    }
    const updatePayload = { ...payload, updated_at: new Date() };
    await modelInstance.update(updatePayload as Record<string, unknown>, { where: { id } });
    return { success: true, message: 'Mehfil directory updated successfully' };
  } catch (error) {
    logger.error('Error updating mehfil-direction:', error as Error);
    throw error;
  }
};

export const deleteMehfilDirection = async (id: string | number) => {
  try {
    if (!id || (typeof id === 'string' && isNaN(Number(id)))) {
      return { success: false, message: 'Invalid mehfil directory ID provided' };
    }
    const row = await modelInstance.findByPk(String(id));
    if (!row) {
      return { success: true, message: 'Mehfil directory not found.' };
    }
    await row.destroy();
    return { success: true, message: 'Mehfil directory deleted successfully.' };
  } catch (error) {
    logger.error('Error deleting mehfil-direction:', error as Error);
    throw error;
  }
};

export const getDirectionById = async (id: string | number) => {
  try {
    if (!id || (typeof id === 'string' && isNaN(Number(id)))) {
      return { success: false, message: 'Invalid mehfil directory ID provided' };
    }
    const row = await modelInstance.findByPk(String(id));
    if (!row) {
      return { success: false, message: 'Mehfil directory not found.' };
    }
    return { success: true, data: row };
  } catch (error) {
    logger.error('Error getDirectionById:', error as Error);
    throw error;
  }
};
