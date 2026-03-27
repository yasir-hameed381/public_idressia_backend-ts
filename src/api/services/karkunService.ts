import { Op } from 'sequelize';
import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import userModel from '../models/user-admin';
import { paginate, constructPagination } from './utilityServices';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const userModelInstance = userModel(sequelize);

export const createKarkun = async (params: {
  zone_id: number;
  name: string;
  email: string;
  password: string;
  city?: string;
  country?: string;
  is_zone_admin?: boolean;
  is_mehfil_admin?: boolean;
  user_type?: string;
  father_name?: string;
  phone_number?: string;
  id_card_number?: string;
  address?: string;
  birth_year?: number;
  ehad_year?: number;
  duty_days?: unknown;
  duty_type?: string;
}) => {
  try {
    const hashedPassword = await bcrypt.hash(params.password, SALT_ROUNDS);
    const payload = {
      zone_id: params.zone_id,
      name: params.name,
      email: params.email,
      password: hashedPassword,
      city: params.city,
      country: params.country,
      is_zone_admin: params.is_zone_admin ?? false,
      is_mehfil_admin: params.is_mehfil_admin ?? false,
      user_type: params.user_type || 'karkun',
      father_name: params.father_name,
      phone_number: params.phone_number,
      id_card_number: params.id_card_number,
      address: params.address,
      birth_year: params.birth_year,
      ehad_year: params.ehad_year,
      duty_days: params.duty_days,
      duty_type: params.duty_type,
      created_at: new Date(),
    };
    return await userModelInstance.create(payload as Parameters<typeof userModelInstance.create>[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error creating karkun: ${message}`);
    throw new Error(`Failed to create karkun: ${message}`);
  }
};

export const getKarkun = async ({
  page = 1,
  size = 50,
  search = '',
  zone_id = null,
  activeTab = null,
  sortBy = 'name',
  sortDirection = 'asc',
  requestUrl = '',
}: {
  page?: number;
  size?: number;
  search?: string;
  zone_id?: number | null;
  activeTab?: string | null;
  sortBy?: string;
  sortDirection?: string;
  requestUrl?: string;
}) => {
  try {
    const { offset, limit, currentPage } = paginate({ page, size });

    const whereConditions: object[] = [{ is_super_admin: false }];

    if (activeTab === 'mehfil_admin') {
      whereConditions.push({ is_mehfil_admin: true });
    } else if (activeTab === 'zone_admin') {
      whereConditions.push({ is_zone_admin: true });
    } else if (activeTab === 'karkun') {
      whereConditions.push({
        [Op.or]: [{ user_type: 'karkun' }, { user_type: 'Karkun' }],
      });
      whereConditions.push({ is_mehfil_admin: false });
      whereConditions.push({ is_zone_admin: false });
    } else if (activeTab === 'ehad_karkun') {
      whereConditions.push({
        [Op.or]: [{ user_type: 'ehad_karkun' }, { user_type: 'EhadKarkun' }],
      });
    } else {
      whereConditions.push({
        [Op.or]: [{ user_type: 'karkun' }, { user_type: 'Karkun' }],
      });
    }

    if (zone_id !== null && zone_id !== undefined) {
      whereConditions.push({ zone_id });
    }

    if (search && search.trim()) {
      whereConditions.push({
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone_number: { [Op.like]: `%${search}%` } },
        ],
      });
    }

    const where =
      whereConditions.length === 1 ? whereConditions[0] : { [Op.and]: whereConditions };

    const sortField = sortBy === 'email' ? 'email' : sortBy === 'created_at' ? 'created_at' : 'name';
    const sortDir = sortDirection === 'desc' ? 'DESC' : 'ASC';

    const { count, rows: data } = await userModelInstance.findAndCountAll({
      where: where as import('sequelize').WhereOptions,
      offset: Math.max(0, offset),
      limit: Math.max(1, Math.min(limit, 100)),
      order: [[sortField, sortDir]],
    });

    const { links, meta } = constructPagination({
      count,
      limit,
      offset,
      currentPage,
      baseUrl: requestUrl || '/api/karkun',
    });

    return { data: data || [], links, meta };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error fetching karkun: ' + message);
    throw error;
  }
};

export const getKarkunById = async (id: string) => {
  try {
    if (!id) {
      return { success: false, message: 'karkun not found' };
    }
    const karkun = await userModelInstance.findOne({
      where: {
        id,
        [Op.or]: [{ user_type: 'karkun' }, { user_type: 'Karkun' }],
      },
    });
    if (!karkun) {
      return { success: false, message: 'karkun not found' };
    }
    return { success: true, data: karkun };
  } catch (error) {
    logger.error('Error fetching karkun users:', error);
    throw error;
  }
};

export const updateKarkun = async (
  id: string,
  params: {
    zone_id?: number;
    name?: string;
    email?: string;
    password?: string;
    city?: string;
    country?: string;
    is_zone_admin?: boolean;
    is_mehfil_admin?: boolean;
    user_type?: string;
    father_name?: string;
    phone_number?: string;
    id_card_number?: string;
    address?: string;
    birth_year?: number;
    ehad_year?: number;
    duty_days?: unknown;
    duty_type?: string;
  },
) => {
  try {
    const karkunCheck = await userModelInstance.findOne({
      where: {
        id,
        [Op.or]: [{ user_type: 'karkun' }, { user_type: 'Karkun' }],
      },
    });
    if (!karkunCheck) {
      return { success: false, message: 'karkun not found' };
    }

    const updatePayload: Record<string, unknown> = { updated_at: new Date() };
    if (params.zone_id !== undefined) updatePayload.zone_id = params.zone_id;
    if (params.name !== undefined) updatePayload.name = params.name;
    if (params.email !== undefined) updatePayload.email = params.email;
    if (params.password !== undefined) {
      updatePayload.password = await bcrypt.hash(params.password, SALT_ROUNDS);
    }
    if (params.city !== undefined) updatePayload.city = params.city;
    if (params.country !== undefined) updatePayload.country = params.country;
    if (params.is_zone_admin !== undefined) updatePayload.is_zone_admin = params.is_zone_admin;
    if (params.is_mehfil_admin !== undefined) updatePayload.is_mehfil_admin = params.is_mehfil_admin;
    if (params.user_type !== undefined) updatePayload.user_type = params.user_type;
    if (params.father_name !== undefined) updatePayload.father_name = params.father_name;
    if (params.phone_number !== undefined) updatePayload.phone_number = params.phone_number;
    if (params.id_card_number !== undefined) updatePayload.id_card_number = params.id_card_number;
    if (params.address !== undefined) updatePayload.address = params.address;
    if (params.birth_year !== undefined) updatePayload.birth_year = params.birth_year;
    if (params.ehad_year !== undefined) updatePayload.ehad_year = params.ehad_year;
    if (params.duty_days !== undefined) updatePayload.duty_days = params.duty_days;
    if (params.duty_type !== undefined) updatePayload.duty_type = params.duty_type;

    await userModelInstance.update(updatePayload as object, { where: { id } });
    return { success: true, message: 'karkun updated successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error update karkun: ' + message);
    throw error;
  }
};

export const deleteKarkun = async (id: string) => {
  try {
    const karkun = await userModelInstance.findOne({
      where: {
        id,
        [Op.or]: [{ user_type: 'karkun' }, { user_type: 'Karkun' }],
      },
    });
    if (!karkun) {
      return { success: false, message: 'Karkun not found' };
    }
    await karkun.destroy();
    return { success: true, message: 'Karkun deleted successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error deleting karkun: ${message}`);
    throw new Error(`Failed to delete karkun: ${message}`);
  }
};
