import logger from '../../config/logger';
import { sequelize } from '../../config/database';
import parhaiyanModel from '../models/parhaiyan';
import { getList } from './listResourceHelper';
import { SearchFields } from '../Enums/searchEnums';

const modelInstance = parhaiyanModel(sequelize);

export const getParhaiyans = async ({
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
    return await getList({
      model: modelInstance as never,
      page,
      size,
      requestUrl,
      search,
      searchFields: [SearchFields.TITLE_EN, SearchFields.TITLE_UR, SearchFields.SLUG],
    });
  } catch (error) {
    logger.error('Error fetching parhaiyan:', error as Error);
    throw error;
  }
};

export const activeParhaiyan = async () => {
  try {
    const list = await modelInstance.findAll({
      where: { is_active: true },
    });
    return list;
  } catch (error) {
    logger.error('Error getting active Parhaiyan:', error as Error);
    throw error;
  }
};
