import logger from '../../config/logger';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import karkunJoinRequestModel from '../models/karkunJoinRequests';
import { paginate, constructPagination } from './utilityServices';

const model = karkunJoinRequestModel(sequelize);

const searchFields = [
  'first_name',
  'last_name',
  'email',
  'phone_number',
  'city',
  'country',
  'user_type',
];

export const getKarkunJoinRequests = async ({
  page = 1,
  size = 25,
  search = '',
  requestUrl = '',
}: {
  page?: number | string;
  size?: number | string;
  search?: string;
  requestUrl?: string;
}) => {
  try {
    const { offset, limit, currentPage } = paginate({ page, size });
    const where: Record<string, unknown> = {};

    if (search && searchFields.length > 0) {
      (where as Record<string, unknown>)[Op.or as unknown as string] = searchFields.map((field) => ({
        [field]: { [Op.like]: `%${search}%` },
      }));
    }

    const { count, rows: data } = await model.findAndCountAll({
      where,
      offset,
      limit,
      order: [['created_at', 'DESC']],
    });

    const { links, meta } = constructPagination({
      count,
      limit,
      offset,
      currentPage,
      baseUrl: requestUrl,
    });

    return { success: true, data, links, meta };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error fetching karkun join requests: ' + message);
    throw error;
  }
};

export const getKarkunJoinRequestById = async (id: string) => {
  try {
    const request = await model.findByPk(id);
    if (!request) {
      return { success: false, message: 'Karkun join request not found.' };
    }
    return { success: true, data: request };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error fetching karkun join request by id: ' + message);
    throw error;
  }
};

export const createKarkunJoinRequest = async (payload: {
  avatar?: string | null;
  first_name: string;
  last_name?: string | null;
  email: string;
  phone_no?: string | null;
  user_type?: string | null;
  birth_year?: string | number | null;
  ehad_year?: string | number | null;
  zone_id?: number | null;
  city?: string | null;
  country?: string | null;
  is_approved?: number | boolean;
}) => {
  try {
    const newRequest = await model.create({
      avatar: payload.avatar ?? null,
      first_name: payload.first_name,
      last_name: payload.last_name ?? null,
      email: payload.email,
      phone_number: payload.phone_no ?? null,
      user_type: payload.user_type ?? 'karkun',
      birth_year: payload.birth_year != null ? String(payload.birth_year) : null,
      ehad_year: payload.ehad_year != null ? String(payload.ehad_year) : null,
      zone_id: payload.zone_id ?? null,
      city: payload.city ?? null,
      country: payload.country ?? null,
      is_approved: payload.is_approved ?? false,
      created_at: new Date(),
      updated_at: new Date(),
    } as Parameters<typeof model.create>[0]);
    return { success: true, data: newRequest };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error creating karkun join request: ' + message);
    throw error;
  }
};

export const updateKarkunJoinRequest = async (
  id: string,
  payload: {
    avatar?: string | null;
    first_name?: string;
    last_name?: string | null;
    email?: string;
    phone_no?: string | null;
    user_type?: string | null;
    birth_year?: string | number | null;
    ehad_year?: string | number | null;
    zone_id?: number | null;
    city?: string | null;
    country?: string | null;
    is_approved?: number | boolean;
  },
) => {
  try {
    const [updated] = await model.update(
      {
        avatar: payload.avatar ?? null,
        first_name: payload.first_name,
        last_name: payload.last_name ?? null,
        email: payload.email,
        phone_number: payload.phone_no ?? null,
        user_type: payload.user_type ?? null,
        birth_year: payload.birth_year != null ? String(payload.birth_year) : null,
        ehad_year: payload.ehad_year != null ? String(payload.ehad_year) : null,
        zone_id: payload.zone_id ?? null,
        city: payload.city ?? null,
        country: payload.country ?? null,
        is_approved: payload.is_approved ?? false,
        updated_at: new Date(),
      } as Parameters<typeof model.update>[0],
      { where: { id } },
    );

    if (!updated) {
      return {
        success: false,
        message: 'Karkun join request not found or update failed.',
      };
    }
    return {
      success: true,
      message: 'Karkun join request updated successfully.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error updating karkun join request: ' + message);
    throw error;
  }
};

export const deleteKarkunJoinRequest = async (id: string) => {
  try {
    const deleted = await model.destroy({ where: { id } });
    if (!deleted) {
      return {
        success: false,
        message: 'Karkun join request not found or delete failed.',
      };
    }
    return {
      success: true,
      message: 'Karkun join request deleted successfully.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error deleting karkun join request: ' + message);
    throw error;
  }
};
