import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import zoneModel from '../models/zone';
import { paginate, constructPagination } from './utilityServices';
import { SearchFields } from '../Enums/searchEnums';

const zonesModelInstance = zoneModel(sequelize);

export const getZones = async ({
  page = 1,
  size = 50,
  search = '',
  requestUrl = '',
}: {
  page?: number | string;
  size?: number | string;
  search?: string;
  requestUrl?: string;
}) => {
  try {
    const searchFields = [
      SearchFields.TITLE_EN,
      SearchFields.TITLE_UR,
      SearchFields.COUNTRY_EN,
      SearchFields.COUNTRY_UR,
      SearchFields.CITY_EN,
      SearchFields.CITY_UR,
      SearchFields.CO,
      SearchFields.PRIMARY_PHONE_NUMBER,
      SearchFields.DESCRIPTION,
    ];
    const { offset, limit, currentPage } = paginate({ page, size });
    const where: Record<string, unknown> = {};
    if (search && searchFields.length > 0) {
      (where as Record<symbol, unknown>)[Op.or as unknown as symbol] = searchFields.map((field) => ({
        [field]: { [Op.like]: `%${search}%` },
      }));
    }
    const { count, rows: data } = await zonesModelInstance.findAndCountAll({
      where,
      offset,
      limit,
    });
    const { links, meta } = constructPagination({ count, limit, offset, currentPage, baseUrl: requestUrl });
    return { data, links, meta };
  } catch (error) {
    logger.error('Error fetching zones:', error as Error);
    throw error;
  }
};

export const createZone = async ({
  titleEn,
  titleUr,
  description,
  countryEn,
  countryUr,
  cityEn,
  cityUr,
  co,
  primaryPhoneNumber,
  secondaryPhoneNumber,
  regionId,
}: {
  titleEn: string;
  titleUr: string;
  description?: string;
  countryEn: string;
  countryUr: string;
  cityEn: string;
  cityUr: string;
  co?: string;
  primaryPhoneNumber?: string;
  secondaryPhoneNumber?: string;
  regionId?: number | null;
}) => {
  try {
    const createZonePayload = {
      title_en: titleEn,
      title_ur: titleUr,
      description,
      country_en: countryEn,
      country_ur: countryUr,
      city_en: cityEn,
      city_ur: cityUr,
      co,
      primary_phone_number: primaryPhoneNumber,
      secondary_phone_number: secondaryPhoneNumber,
      region_id: regionId ?? null,
      created_at: new Date(),
    };
    return await zonesModelInstance.create(createZonePayload as Record<string, unknown>);
  } catch (error) {
    logger.error('Error creating zone:', error as Error);
    throw new Error(`Failed to create zone: ${(error as Error).message}`);
  }
};

export const updateZone = async ({
  id,
  titleEn,
  titleUr,
  description,
  countryEn,
  countryUr,
  cityEn,
  cityUr,
  co,
  primaryPhoneNumber,
  secondaryPhoneNumber,
  regionId,
}: {
  id: string | number;
  titleEn: string;
  titleUr: string;
  description?: string;
  countryEn: string;
  countryUr: string;
  cityEn: string;
  cityUr: string;
  co?: string;
  primaryPhoneNumber?: string;
  secondaryPhoneNumber?: string;
  regionId?: number | null;
}) => {
  try {
    const zoneCheck = await zonesModelInstance.findByPk(String(id));
    if (!zoneCheck) {
      return { success: false, message: 'Zone not found' };
    }
    const updatePayload = {
      title_en: titleEn,
      title_ur: titleUr,
      description,
      country_en: countryEn,
      country_ur: countryUr,
      city_en: cityEn,
      city_ur: cityUr,
      co,
      primary_phone_number: primaryPhoneNumber,
      secondary_phone_number: secondaryPhoneNumber,
      ...(regionId !== undefined && { region_id: regionId }),
      updated_at: new Date(),
    };
    await zonesModelInstance.update(updatePayload as Record<string, unknown>, { where: { id } });
    return { success: true, message: 'Zone updated successfully' };
  } catch (error) {
    logger.error('Error updating zone:', error as Error);
    throw error;
  }
};

export const deleteZone = async (id: string | number) => {
  try {
    if (!id || (typeof id === 'string' && isNaN(Number(id)))) {
      return { success: false, message: 'Invalid zone ID provided' };
    }
    const zone = await zonesModelInstance.findByPk(String(id));
    if (!zone) {
      return { success: false, message: 'Zone not found.' };
    }
    await zone.destroy();
    return { success: true, message: 'Zone deleted successfully.' };
  } catch (error) {
    logger.error('Error deleting zone:', error as Error);
    throw error;
  }
};

export const getZoneById = async (id: string | number) => {
  try {
    if (!id || (typeof id === 'string' && isNaN(Number(id)))) {
      return { success: false, message: 'Invalid zone ID provided' };
    }
    const zone = await zonesModelInstance.findByPk(String(id));
    if (!zone) {
      return { success: false, message: 'Zone not found.' };
    }
    return { success: true, data: zone };
  } catch (error) {
    logger.error('Error getting zone:', error as Error);
    throw error;
  }
};
