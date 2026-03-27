import logger from '../../config/logger';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import parhaiyanRecitationsModel from '../models/parhaiyan-recitations';
import { paginate, constructPagination } from './utilityServices';
import { SearchFields } from '../Enums/searchEnums';

const model = parhaiyanRecitationsModel(sequelize);

const searchFieldsList = [
  SearchFields.NAME,
  SearchFields.FATHERNAME,
  'city' as const,
  'mobile_number' as const,
];

export const getParhaiyanRecitations = async ({
  page = 1,
  size = 25,
  search = '',
  parhaiyan_id = null,
  requestUrl = '',
}: {
  page?: number | string;
  size?: number | string;
  search?: string;
  parhaiyan_id?: number | null;
  requestUrl?: string;
}) => {
  try {
    const { offset, limit, currentPage } = paginate({ page, size });
    const where: Record<string, unknown> = {};

    if (parhaiyan_id != null) {
      where.parhaiyan_id = parhaiyan_id;
    }

    if (search && searchFieldsList.length > 0) {
      (where as Record<string, unknown>)[Op.or as unknown as string] = searchFieldsList.map((field) => ({
        [field]: { [Op.like]: `%${search}%` },
      }));
    }

    const { count, rows: data } = await model.findAndCountAll({
      where,
      offset,
      limit,
    });

    const { links, meta } = constructPagination({
      count,
      limit,
      offset,
      currentPage,
      baseUrl: requestUrl,
    });

    return { data, links, meta };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Error fetching parhaiyan: ' + message);
    throw error;
  }
};

export const createParhaiyanRecitations = async ({
  parhaiyan_id,
  darood_ibrahimi,
  yaseen_shareef,
  qul_shareef,
  quran_pak,
  name,
  father_name,
  city,
  mobile_number,
  ...prop
}: {
  parhaiyan_id: number;
  darood_ibrahimi?: number;
  yaseen_shareef?: number;
  qul_shareef?: number;
  quran_pak?: number;
  name: string;
  father_name: string;
  city: string;
  mobile_number: string;
  [key: string]: unknown;
}) => {
  try {
    const payload = {
      parhaiyan_id,
      darood_ibrahimi: darood_ibrahimi ?? 0,
      yaseen_shareef: yaseen_shareef ?? 0,
      qul_shareef: qul_shareef ?? 0,
      quran_pak: quran_pak ?? 0,
      name,
      father_name,
      city,
      mobile_number,
      created_at: new Date(),
      ...prop,
    };
    return await model.create(payload as Parameters<typeof model.create>[0]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error creating parhaiyan recitation: ${message}`);
    throw new Error(`Failed to create recitation: ${message}`);
  }
};

export const deleteParhaiyanRecitation = async (id: string) => {
  try {
    const recitation = await model.findByPk(id);
    if (!recitation) {
      throw new Error('Recitation not found');
    }
    await recitation.destroy();
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error deleting recitation: ${message}`);
    throw new Error(`Failed to delete recitation: ${message}`);
  }
};
